# Amazon Alexa Prime Video Skill

This is a small sample AWS Lambda written in Node.js that queries the Amazon Product API to get the latest Movie
releases and returns a response suitable for the Amazon Alexa Skill API.

## Requirements
- AWS identity keys
- Amazon Product Services token
- Node.js and npm

## Configuration / Building
1. After checking out, run `npm install` to get the required libraries
2. Copy `config.sample.json` to `config.json` and enter the appropriate AWS keys

# Alexa Skill Usage
This skill is designed to be used by saying "Alexa, ask Prime Video for the latest movies".

## Notes:
- Setting up the Alexa skill and Lambda configuration should be done by following the appropriate documentation from
Amazon
- `icon108.png` and `icon512.png` are the sample icons to use when setting up the Alexa Skill

# TODO
- Add screenshots/documentation for setting up the Skill in the Developer Portal
- Add builder to archive `node_modules`, `app.js`, and `config.json` for Lambda deployment
