# BACI Product Space Visualization

![Screenshot of application frontend.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/1be62a6e-6bda-4b03-b57f-c95ab4f7a14c.png)

Aggregates CEPII BACI HS92 trade data into year-by-year top-product time series and lookup summaries.

## Overview

The backend Python script ingests yearly BACI trade files and a corresponding HS6 product code lookup table, validates and cleans the data, aggregates trade value by product code and selects the top N products per year by total trade value. It then exports multiple JSON files intended to be visualized with JavaScript.

On the frontend, D3.js renders this processed data as an interactive horizontal bar chart. Users can scrub through time with a slider, play/pause an automated progression and dynamically adjust how many top products are displayed. Bars are colored by trade value and smoothly transition between years, while tooltips provide detailed product information on hover.

Together, the backend data transformation and frontend visualization create an exploratory product space view of how leading traded goods evolve over time.

## Set Up Instructions

Below are the required software programs and instructions for installing and using this application.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps For Use

1. Install the above programs

2. Open a terminal

3. Clone this repository using `git` by running the following command: `git clone git@github.com:devbret/baci-data.git`

4. Navigate to the repo's directory by running: `cd baci-data`

5. Create a virtual environment with this command: `python3 -m venv venv`

6. Activate your virtual environment using: `source venv/bin/activate`

7. Install the needed dependencies for running the script: `pip install -r requirements.txt`

8. Download [the raw source data](https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37)

9. Place all of the relevant CSV files into the `./data/baci` directory

10. Run the Python script using this command: `python3 app.py`

11. Launch a local HTTP server to view the frontend UI: `python3 -m http.server`

12. Visit the following URL in a modern web browser: `http://localhost:8000`

13. To exit the virtual environment, type this command in the terminal: `deactivate`

## Other Considerations

This project repo is intended to demonstrate an ability to do the following:

- Process global trade data to identify and rank top exported products by value for each year

- Visualize yearly product rankings as an animated, interactive bar chart

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
