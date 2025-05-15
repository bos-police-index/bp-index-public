[![Netlify Status](https://api.netlify.com/api/v1/badges/168b2ed1-4784-4179-b85b-84a67618a35e/deploy-status)](https://app.netlify.com/sites/dev-bpi/deploys)

# Boston Police Index

## System Architecture:

This web-app is a site with a [Next.js](https://nextjs.org/) framework, with a PostreSQL server as the backend interacted with using [GraphQL](https://graphql.org/). We also use [Material UI](https://mui.com) and [TSX](https://www.npmjs.com/package/tsx) to assist in the front-end.

The [Boston Police Index](https://dev-bpi.netlify.app), aims to be a successor to the now inactive [Woke Windows](https://www.wokewindows.org) project, where we aim to make Boston police data as accessible and easy to understand for as many people as possible.

# Directory Structure Overview
Read more about the specifics of the directories in their respective `README.md`'s

**`/components`** - where all components live that are referenced 1 or more times in `/pages`. These are kept here as they aren't routable and it promotes reusability + organization. Consider creating components to put in this directory instead of writing extremely long files in `/pages` 

**`/interfaces`** - where all TypeScript interfaces live for code cleanliness and reusability purposes.

**`/lib`** - where all GraphQL queries live as well as the Apollo Client Initialization 

**`/pages`** - the standard directory in Next.js for routing ([brush up about it here](https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts)). Every directory is a path, so everything in this directory is routable ([except for those starting with _](https://nextjs.org/docs/app/getting-started/project-structure#private-folders)). For components of specific pages that most likely have no other use (ex: `./feedback/_FeedbackForm.tsx`) you can colocate those with their respective page. `./profile` and `./data/tables` make use of [dynamic routes](https://nextjs.org/docs/app/getting-started/project-structure#private-folders).

**`/public`** - the standard directory in Next.js for images. Keep all src images in this directory. Many of these images are not actually being used, feel free to clean those out.

**`/services`** - where complex data fetching logic can be placed instead of bloating files in the `/pages` directory. Serves same purpose as `/components` but for data fetching.

**`/styles`** - where themes, global styles, and hex code variables are stored. Only need to touch this if changing the color / ratios of the site.

**`/utility`** - where ad hoc helper methods, text formatters, and maps live. 


# Getting Set Up to Contribute
1. Populate your own `.env` file using `.env.example`
2. Familiarize yourself with the repository structure (each high level directory has a `README.md` but below there is a summary of what each directory is for)
3. Consult **Work to Be Done** to see what you can work on

## Testing Local Changes
To test changes locally, run either commands:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3010](http://localhost:3010) with your browser to see the result.

# Next.js Configuration Information
1. We're using typed routes for Next.js. This means that when you are navigating using `<Link />` or similar methods you will get type checking and type hints for the routes.
2. We are using `superjson` to handle automatic serialization and deserialization of data between the server and the client. This means that you can use `Date` objects and other complex types in your data and they will be serialized and deserialized automatically. It should be noted that the data you return from `getStaticProps` etc should still be fairly "simple" in nature as there is a cost to serialization and deserialization.


# Work to Be Done
This is a high level description of what needs to be done. To get access to the [Kanban board](https://www.atlassian.com/agile/kanban/boards#:~:text=A%20kanban%20board%20is%20an,order%20in%20their%20daily%20work.) please consult the onboarding materials in Google Drive. Particularly the Project Description.

## 🚀 New Functionality

---

### 1. Server-Side Pagination Rollout for `/data`

To achieve a **60× performance gain**, we are deprecating client-side pagination. As a result, all core features on the `/data` page need to be re-implemented using server-side logic.

**Progress Checklist:**

- [x] Single Page Pagination  
- [x] Exact Filtering (`=`)  
- [x] Sorting (`ASC` / `DESC`)  
- [x] Select Columns  
- [ ] Fuzzy Filtering (`contains`)  
- [ ] Export Current Columns (active filter only)  
- [ ] Export Entire Table  

---

### 2. UX Enhancements for Server-Side Pagination

Improving user experience alongside functional upgrades.

**Planned Improvements:**

- [ ] Preload next **X** pages to reduce pagination lag  
- [ ] Add "Drill Down" pages for each row (similar to officer profile pages) 

## 👷‍♂️ Known Issues to Solve
### 1. Filtering vs Formatted Data Mismatch

**Problem:**  
Users see *formatted* data in `/data`, but filters operate on the *raw* data. This causes confusion when filtering doesn’t return expected results.

**Why this happens:**
- We use **text formatters** to make raw data more legible.
- Filters are applied to unformatted (raw) values.

**Considered Solutions:**

| Possible Solution                     | Drawbacks                                                                                          |
|--------------------------------------|-----------------------------------------------------------------------------------------------------|
| Change backend data to be legible    | Not sustainable. Every new dataset would need transformation. Risk of losing important raw details. |
| Abandon all text formatters          | Reduces readability. Raw data may be inconsistently typed (e.g., `"T"`/`"F"` strings vs booleans).  |

---

### 2. Pagination Limits Export and Performance

**Problem:**  
The data page only loads the **currently visible rows** on the frontend.

**Implications:**
- "Export Current Columns" only exports the **current page**.
- Pagination is **slow** due to data fetching on each page switch.