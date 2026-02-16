import os
import glob
import json
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data", "baci")
OUT_DIR = os.path.join(BASE_DIR, "out")

PRODUCT_CODES_FILE = os.path.join(DATA_DIR, "product_codes_HS92_V202601.csv")
BACI_GLOB = os.path.join(DATA_DIR, "BACI_HS92_Y*_V202601.csv")

TOP_N_PER_YEAR = 300
MIN_VALUE_KUSD = 0.0 

os.makedirs(OUT_DIR, exist_ok=True)

def hs6_str(k: int) -> str:
    return str(int(k)).zfill(6)


def read_baci_file(path: str) -> pd.DataFrame:
    try:
        df = pd.read_csv(path, sep="\t")
        if df.shape[1] == 1:
            df = pd.read_csv(path)
    except Exception:
        df = pd.read_csv(path)

    required = {"t", "i", "j", "k", "v", "q"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"{path} missing columns: {missing}")

    df["t"] = pd.to_numeric(df["t"], errors="coerce").astype("Int64")
    df["k"] = pd.to_numeric(df["k"], errors="coerce").astype("Int64")
    df["v"] = pd.to_numeric(df["v"], errors="coerce")
    df["q"] = pd.to_numeric(df["q"], errors="coerce")

    df = df.dropna(subset=["t", "k", "v"])

    if MIN_VALUE_KUSD > 0:
        df = df[df["v"] >= MIN_VALUE_KUSD]

    return df


def load_product_codes(path: str) -> pd.DataFrame:
    if not os.path.exists(path):
        raise FileNotFoundError(f"Missing product codes file: {path}")

    codes = pd.read_csv(path)

    if "code" not in codes.columns or "description" not in codes.columns:
        raise ValueError(
            f"Expected columns 'code' and 'description' in {path}, found: {list(codes.columns)}"
        )

    codes["code"] = pd.to_numeric(codes["code"], errors="coerce").astype("Int64")
    codes["description"] = codes["description"].astype(str)

    codes = codes.dropna(subset=["code"])
    codes = codes.rename(columns={"code": "k", "description": "name"})
    codes = codes.drop_duplicates(subset=["k"], keep="first")

    return codes[["k", "name"]]

def main():
    print("Loading product codes...")
    codes_df = load_product_codes(PRODUCT_CODES_FILE)
    code_map = dict(zip(codes_df["k"].astype(int), codes_df["name"]))

    baci_files = sorted(glob.glob(BACI_GLOB))
    if not baci_files:
        raise RuntimeError(f"No BACI files found matching: {BACI_GLOB}")

    yearly_rows = []
    yearly_totals = []
    overall_totals = {}

    for fp in baci_files:
        df = read_baci_file(fp)
        year = int(df["t"].iloc[0])

        grouped = df.groupby("k", as_index=False).agg(
            value_kusd=("v", "sum"),
            qty_tons=("q", "sum")
        )

        total_year_value = float(grouped["value_kusd"].sum())
        yearly_totals.append({
            "year": year,
            "total_value_kusd": total_year_value
        })

        grouped = grouped.sort_values("value_kusd", ascending=False)

        if TOP_N_PER_YEAR is not None:
            grouped = grouped.head(TOP_N_PER_YEAR)

        grouped["year"] = year
        grouped["hs6"] = grouped["k"].apply(hs6_str)
        grouped["name"] = grouped["k"].apply(
            lambda kk: code_map.get(int(kk), "Unknown")
        )

        yearly_rows.append(grouped)

        for k, v in zip(grouped["k"], grouped["value_kusd"]):
            k = int(k)
            overall_totals[k] = overall_totals.get(k, 0.0) + float(v)

        print(f"Processed {os.path.basename(fp)} -> year {year}, rows kept: {len(grouped)}")

    product_space = pd.concat(yearly_rows, ignore_index=True)

    years_sorted = sorted(product_space["year"].unique().tolist())
    by_year = []

    for y in years_sorted:
        sub = product_space[product_space["year"] == y] \
            .sort_values("value_kusd", ascending=False)

        by_year.append({
            "year": int(y),
            "products": [
                {
                    "k": int(row.k),
                    "hs6": row.hs6,
                    "name": row.name,
                    "v": float(row.value_kusd),
                    "q": float(row.qty_tons) if pd.notna(row.qty_tons) else None
                }
                for row in sub.itertuples(index=False)
            ]
        })

    product_space_timeseries = {
        "meta": {
            "top_n_per_year": TOP_N_PER_YEAR,
            "min_value_kusd": MIN_VALUE_KUSD,
            "units": {
                "v": "thousand USD",
                "q": "metric tons"
            },
            "source": "CEPII BACI HS92",
            "codes_file": "product_codes_HS92_V202601.csv"
        },
        "years": years_sorted,
        "data": by_year
    }

    top_overall = sorted(overall_totals.items(),
                         key=lambda x: x[1],
                         reverse=True)

    top_products_overall = [
        {
            "k": int(k),
            "hs6": hs6_str(k),
            "name": code_map.get(int(k), "Unknown"),
            "value_kusd": float(v)
        }
        for k, v in top_overall[:1000]
    ]

    year_totals_sorted = sorted(yearly_totals,
                                key=lambda x: x["year"])

    lookup = product_space.groupby(
        ["k", "hs6", "name"], as_index=False
    ).agg(
        years_present=("year", "nunique"),
        total_value_kusd=("value_kusd", "sum"),
        avg_value_kusd=("value_kusd", "mean"),
        max_value_kusd=("value_kusd", "max")
    ).sort_values("total_value_kusd", ascending=False)

    product_lookup = [
        {
            "k": int(r.k),
            "hs6": r.hs6,
            "name": r.name,
            "years_present": int(r.years_present),
            "total_value_kusd": float(r.total_value_kusd),
            "avg_value_kusd": float(r.avg_value_kusd),
            "max_value_kusd": float(r.max_value_kusd)
        }
        for r in lookup.itertuples(index=False)
    ]

    with open(os.path.join(OUT_DIR, "product_space_timeseries.json"), "w", encoding="utf-8") as f:
        json.dump(product_space_timeseries, f, ensure_ascii=False)

    with open(os.path.join(OUT_DIR, "top_products_overall.json"), "w", encoding="utf-8") as f:
        json.dump(top_products_overall, f, ensure_ascii=False)

    with open(os.path.join(OUT_DIR, "year_totals.json"), "w", encoding="utf-8") as f:
        json.dump(year_totals_sorted, f, ensure_ascii=False)

    with open(os.path.join(OUT_DIR, "product_lookup.json"), "w", encoding="utf-8") as f:
        json.dump(product_lookup, f, ensure_ascii=False)

    missing_names = (product_space["name"] == "Unknown").sum()
    total_rows = len(product_space)

    print(f"\nName coverage: {total_rows - missing_names}/{total_rows} matched.")
    if missing_names:
        print("Some HS6 codes did not match the product code file.")

    print("\nFinished. Files written to:", OUT_DIR)


if __name__ == "__main__":
    main()
