[![Netlify Status](https://api.netlify.com/api/v1/badges/168b2ed1-4784-4179-b85b-84a67618a35e/deploy-status)](https://app.netlify.com/sites/dev-bpi/deploys)

# Boston Police Index

## System Architecture:

This web-app is a site with a [Next.js](https://nextjs.org/) framework, with a PostreSQL server as the backend. We also use [Material UI](https://mui.com) and [TSX](https://www.npmjs.com/package/tsx) to assist in the front-end.

The [Boston Police Index](https://dev-bpi.netlify.app), aims to be a successor to the now inactive [Woke Windows](https://www.wokewindows.org) project, where we aim to make Boston police data as accessible and easy to understand for as many people as possible.

## How to install and use Prisma

Prisma is a next generation ORM that can be used to access databases in node.js and Typescript applications. Essentially, for this project, you are attempting to build a full stack application that fetches data from the backend and presents the tables on the website.

Prerequisites
Node.js
PostgreSQL Database
Github account

Next, refer to this link and follow the steps to test out Prisma.
https://vercel.com/guides/nextjs-prisma-postgres

When you reach step 2 in the tutorial where it asks you for a database url, talk to the professor and ask for the database url.
Note that, if you try to run the repo locally, you will realize that you need to create a dummy .env file on the root of the directory because github hides the database url for the public to see. Meaning you would need to create a .env file and include the url every time.

# .env

DATABASE_URL = "URL"

Step 3
The tutorial shows you how to create a schema in your database. In other words, you would need to create columns and define data types.
npx prisma db push to make the changes to the database.

npx prisma studio will open an url and you can see the database.

## Testing Local Changes

To test changes locally, run either commands:
npm run dev will open up a url which then directs you to the website of the page..

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying any file. The page auto-updates as you edit the file.

# Next.js Configuration Information

1. We're using typed routes for Next.js. This means that when you are navigating using `<Link />` or similar methods you will get type checking and type hints for the routes.
2. We are using `superjson` to handle automatic serialization and deserialization of data between the server and the client. This means that you can use `Date` objects and other complex types in your data and they will be serialized and deserialized automatically. It should be noted that the data you return from `getStaticProps` etc should still be fairly "simple" in nature as there is a cost to serialization and deserialization.

## How the database works
* Import the datasets into DBeaver and select the categories for each variable such as int, date, time…
* Then go to prisma file, select schema.prisma to assign @id from the variable and remove the @ignore for each dataset
* The PlaceHolder tables are directly connected with the .csv files of the datasets, the user should be able to download the .csv files from under the table “download” button.

## Things to be worked on (will move to issues)

* **Goal 1**: The current dataset does not contain IDs of the police officers, woke windows has a way to connect all the databases together. We need to clean the data and find the IDs for the police officers for the data to be grabbed to the tables. There should also be a way to add links to the rows of the columns that contain identification of the officer (employee_id).
* **Goal 2**: Multiple dynamic placeholder tables need to be created for the officer profiles after IDs are added to the datasets. This placeholder table needs to grab each section of the data (ie. income history) in a condensed form to display for each officer. Each table for each section of the data (on officer profiles) needs to be linked to a page that can show the full data in a non-condensed form (a different page for each section of the data).
* **Goal 3**: The current setup displays all the columns in a dataset all at once (when clicked in from the main page). With the large datasets that we have (100k+ columns), the page is extremely slow at generating the table. The table needs to be modified to show 100 columns at a time, and there can be forward and backward buttons that let you go through the entire dataset (like a library catalog) so that it does not take as long to generate.
* **Goal 4**: The current large data tables (when clicked in from the main page) need to be dynamically linked to the corresponding officer profiles via officer ID. For example, from the main page, clicking pay information will take you to a page with a large table of pay information data. Each column in this table should show information about an officer with an ID. Clicking on the ID the column should allow you to visit that officer’s specific officer profile page. The dynamic routing should allow you to input a link (http://localhost::3000/details/officer_profile/755) and show information about the officer with ID #27. There should NOT be a different static page for every officer.

## Contribution Steps
**Step 1**: Move task from “Sprint Backlog” to “In Progress”

Log in to the [Boston Police Index Taiga Page](https://tree.taiga.io/project/langdon-boston-police-index/timeline) and click “Scrum” then “Backlog”. Click a task you want to work on and click “In Progress” for a task you want to work on.

**Step 2**: Create a branch

Click onto the top left “Branch” button and create a new branch by clicking the “New Branch Button on the top right. Name the new branch something related to the change.

**Step 3**: Add any changes or modifications

After switching to the new branch in your IDE, make modifications to complete the selected task from Step 1. Make sure to test your changes before pushing as outlined in [Testing Local Changes](#testing-local-changes).

**Step 4**: Submit a pull request to Git

Click on the “Pull request” button and create a new pull request by clicking the “New pull request” button on the top right. Select the correct branch, confirm that changes are correct, and submit the pull request.

**Step 5**: Other teammates review the new changes and give a “thumbs up”

A teammate should notify others in the group using the appropriate methods when a pull request is submitted. A separate teammate should check the changes the made and give it a “thumbs up” by moving the task from “In Progress” to “Ready for Review” as outlined in Step 6

**Step 6**: Move task from “In Progress” to “Ready for Review”

Log in to the [Boston Police Index Taiga Page](https://tree.taiga.io/project/langdon-boston-police-index/timeline) and click “Scrum” then “Backlog”. Click a task you want to work on and click “Ready for Review” for a task you want reviewed.

**Step 7**: Wait for the project manager to approve the Pull Request before merging

Patience is important, please wait for the project manager to approve the pull request.

**Step 8**: Once approved, merge

After the project manager approves the changes, go ahead and merge the new branch to the main branch.

**Step 9**: Once merged, move the task to “Done”
