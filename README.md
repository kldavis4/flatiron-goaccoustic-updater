# Go Accoustic Lead Updater

## Pre-requisites

- [Node.js](https://nodejs.org/en/download)

## Setup

### Install dependencies

`npm install`

### Configuration

Copy `.env.example` to `.env` and populate the variables

#### Variables

| Name          | Description                                                                                        |
|---------------|----------------------------------------------------------------------------------------------------|
| CSV_INPUT     | Path to the file containing the lead data (ex. './creatives.csv')                                  |
| API_HOST      | Name of the api host (ex. 'campaign-us-4.goacoustic.com')                                          |
| CLIENT_ID     | Client id used for oauth                                                                           |
| CLIENT_SECRET | Client secret used for oauth                                                                       |
| REFRESH_TOKEN | Refresh token used for oauth                                                                       |
| LIST_ID       | List id                                                                                            |
| EMAIL_FIELD   | Name of the field used for email                                                                   |
| UPDATE_FIELD  | Name of the field being updated. The column name in the CSV should match the value in Go Accoustic |

## Execution

`node ./index.js`
