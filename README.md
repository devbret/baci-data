# BACI Product Space Visualization

![Screenshot of application frontend.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/1be62a6e-6bda-4b03-b57f-c95ab4f7a14c.png)

Aggregates CEPII BACI HS92 trade data into year-by-year top-product time series and lookup summaries.

## Overview

The backend Python script ingests yearly BACI trade files and a corresponding HS6 product code lookup table, validates and cleans the data, aggregates trade value by product code and selects the top N products per year by total trade value. It then exports multiple JSON files intended to be visualized with JavaScript.

On the frontend, D3.js renders this processed data as an interactive horizontal bar chart. Users can scrub through time with a slider, play/pause an automated progression and dynamically adjust how many top products are displayed. Bars are colored by trade value and smoothly transition between years, while tooltips provide detailed product information on hover.

Together, the backend data transformation and frontend visualization create an exploratory product space view of how leading traded goods evolve over time.

## Data Source

If you would like to deploy this application yourself, here is [a link to the BACI data source](https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37).
