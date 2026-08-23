# BACI Product Space Visualization

![Screenshot of application frontend.](https://hosting.photobucket.com/bbcfb0d4-be20-44a0-94dc-65bff8947cf2/1be62a6e-6bda-4b03-b57f-c95ab4f7a14c.png)

Transform CEPII BACI HS92 trade CSVs into structured JSON files for exploring yearly top-product rankings, overall product value summaries and HS6 product lookup metadata.

## Application Overview

The backend Python script ingests yearly BACI trade files and a corresponding HS6 product code lookup table, validates and cleans the data, aggregates trade value by product code and selects the top N products per year by total trade value. It then exports multiple JSON files intended to be visualized with JavaScript.

On the frontend, D3.js renders this processed data as an interactive horizontal bar chart. Users can scrub through time with a slider, play/pause an automated progression and dynamically adjust how many top products are displayed. Bars are colored by trade value and smoothly transition between years, while tooltips provide detailed product information on hover.

Together, the backend data transformation and frontend visualization create an exploratory product space view of how leading traded goods evolve over time.

## Basic Setup Instructions

Below are the required software programs and instructions for installing and using this application on a Linux machine.

### Programs Needed

- [Git](https://git-scm.com/downloads)

- [Python](https://www.python.org/downloads/)

### Steps For Use

1. Install the above programs

2. Open a terminal

3. Clone this repository: `git clone git@github.com:devbret/baci-data.git`

4. Navigate to the repo's directory: `cd baci-data`

5. Create a virtual environment: `python3 -m venv venv`

6. Activate your virtual environment: `source venv/bin/activate`

7. Install the needed dependencies: `pip install -r requirements.txt`

8. Download [the raw source data](https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37)

9. Place all of the relevant CSV files into the `/data/baci` directory

10. Run the Python script: `python3 app.py`

11. Launch an HTTP server: `python3 -m http.server`

12. View the frontend in a browser: `http://localhost:8000`

13. When finished, close the HTTP server: `CTRL + c`

14. Exit the virtual environment: `deactivate`

## Other Considerations

Below you will find additional details about this project which fall outside of the setup and usage instructions above. They outline the specific skills and techniques this repository is meant to demonstrate, explain the licensing terms governing reuse of the code and provide contact information for questions or collaboration.

### Abilities Demonstrated

This project repo is intended to demonstrate an ability to do the following:

- Process raw source data to identify the highest-value traded product categories for each year

- Convert raw BACI CSV files into JSON datasets to summarize total trade values and product lookup information

- Visualize the top products by year as an interactive, animated horizontal bar chart

- Hover over each bar to see detailed information including the product name, trade value and quantity in tons

### License Information

This project is distributed under the MIT License. Which enables you to to use, copy, modify, merge, publish, distribute, sublicense and sell copies of this software, inclduing for commercial purposes, provided the original copyright and permission notices are included with any copies or substantial portions of the work. The software is provided "as is", without warranty of any kind, and the copyright holder accepts no liability arising from its use.

If you have any questions or would like to collaborate, please reach out either on GitHub or via [my website](https://bretbernhoft.com/).
