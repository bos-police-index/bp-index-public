# Boston Police Index

[![Netlify Status](https://api.netlify.com/api/v1/badges/168b2ed1-4784-4179-b85b-84a67618a35e/deploy-status)](https://app.netlify.com/sites/dev-bpi/deploys)

## Project Overview

The Boston Police Index (BPI) is a public transparency initiative that provides accessible insights into Boston Police Department data. Our platform serves as a comprehensive data portal for researchers, journalists, and community members to analyze police activities, compensation, and accountability measures.

### Project Goals

-   Provide transparent access to Boston police data
-   Enable data-driven policy discussions
-   Support community oversight through accessible visualizations
-   Maintain historical records for longitudinal analysis

### Key Features

-   ✅ Modern, responsive UI with drill-down capabilities
-   ✅ Advanced data export functionality
-   ✅ Interactive data visualizations
-   ✅ Mobile-responsive design
-   Comprehensive search and filtering
-   Historical data tracking

## Deliverables & Resources

### Live Deployments

-   **Main Application**: [Boston Police Index](https://dev-bpi.netlify.app)

### Data Sources

-   Analyze Boston datasets
-   Public records requests
-   Historical archives from Woke Windows project

## Handoff Notes

### Recently Completed Features

1. **UI/UX Improvements**

    - Complete redesign for better usability
    - Mobile-responsive layout implementation
    - Drill-down functionality for detailed data exploration

2. **Data Export**
    - Comprehensive export options
    - Multiple format support
    - Batch export capabilities

### Next Priority Tasks

1. **Data Processing**

    - Standardize percentile calculations across components
    - Implement consistent data transformation methods
    - Add data validation layers

2. **Performance**

    - Implement pagination preloading
    - Optimize GraphQL queries
    - Add background data loading

3. **User Experience**
    - Enhance search functionality with autocomplete
    - Add new visualization options
    - Improve error messaging

### Getting Started Guide for New Team

1. **First Week Tasks**

    - Review the current data processing implementation in `/services/profile/`
    - Examine visualization components in `/components/profileVisualizations/`
    - Study the GraphQL query structure in `/lib/graphql/`

2. **Quick Wins**

    - Start with standardizing percentile calculations
    - Implement basic error boundaries
    - Add input validation to data processing functions

3. **Long-term Focus**

    - Improve test coverage
    - Enhance documentation
    - Optimize performance for large datasets

4. **Key Files to Review**
    - `/services/profile/data_fetchers.ts` - Main data processing
    - `/components/DataTable.tsx` - Core table component
    - `/utility/createMUIGrid.tsx` - Table definitions
    - `/lib/graphql/queries.ts` - GraphQL queries

## System Architecture

The Boston Police Index is built with modern web technologies:

-   **Frontend**: [Next.js](https://nextjs.org/) (React framework) with TypeScript
-   **UI Components**: [Material UI](https://mui.com) for a consistent and accessible interface
-   **Backend**: PostgreSQL database with [GraphQL](https://graphql.org/) API layer
-   **API Gateway**: PostGraphile for type-safe GraphQL schema generation
-   **Deployment**: Netlify for continuous deployment and hosting

The [Boston Police Index](https://dev-bpi.netlify.app) aims to be a successor to the now inactive [Woke Windows](https://www.wokewindows.org) project, making Boston police data accessible and easy to understand for the public.

## Requirements

-   Node.js 18.x or later
-   npm 8.x or later
-   PostgreSQL 14.x or later

# Directory Structure Overview

| Directory     | Purpose                                                                                                                                                                                                                                                                                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/components` | Houses reusable components referenced across pages. Promotes modularity and code organization. Create components here instead of writing large files in `/pages`.                                                                                                                                                                                                        |
| `/interfaces` | Contains shared TypeScript interfaces. Local interfaces used in single files should remain in their source files.                                                                                                                                                                                                                                                        |
| `/lib`        | Contains GraphQL queries and Apollo Client initialization.                                                                                                                                                                                                                                                                                                               |
| `/pages`      | Next.js routing directory. Each folder represents a route path ([routing docs](https://nextjs.org/docs/pages/building-your-application/routing/pages-and-layouts)). All directories are routable except those prefixed with `_`. Uses [dynamic routes](https://nextjs.org/docs/app/getting-started/project-structure#private-folders) for `/profile` and `/data/tables`. |
| `/public`     | Next.js static assets directory. Contains images and other public resources. Note: Some images are unused and can be cleaned up.                                                                                                                                                                                                                                         |
| `/services`   | Houses complex data fetching logic, keeping `/pages` lean. Similar to `/components` but for data operations.                                                                                                                                                                                                                                                             |
| `/styles`     | Contains theme configuration, global styles, and color variables. Edit only when changing site design.                                                                                                                                                                                                                                                                   |
| `/utility`    | Contains helper functions, text formatters, and mapping utilities.                                                                                                                                                                                                                                                                                                       |

# Getting Set Up to Contribute

## Prerequisites

1. Install Node.js 18.x or later and npm 8.x or later
2. Request access to:
    - GraphiQL interface
    - Notion board
    - GitHub Private Repository
    - PostgreSQL Database (DBeaver access)
    - Slack channel
    - Environment secrets

## Setup Steps

1. Clone the repository
2. Copy `.env.example` to `.env` and populate with your credentials
3. Install dependencies:
    ```bash
    npm install
    ```
4. Familiarize yourself with the repository structure in the **Directory Structure Overview** above
5. Check the **Work to Be Done** section and **Notion board** for tasks

## Testing Local Changes

To test changes locally, run either command:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3010](http://localhost:3010) with your browser to see the result.

## Contributing Guidelines

1. Create a new branch for each feature/bugfix
2. Follow the TypeScript code style
3. Update documentation as needed
4. Submit pull requests against the main branch

# Next.js Configuration Information

| Feature                   | Description                                               | Usage Notes                                                                                                                                                                                                         |
| ------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Typed Routes**          | Type-safe routing with `<Link />` components              | • Provides type checking and hints for routes<br>• Catches routing errors at compile time<br>• Helps with refactoring and maintenance                                                                               |
| **SuperJSON Integration** | Handles complex data types in server/client communication | • Supports `Date`, `Map`, `Set`, and other complex objects<br>• Automatic serialization/deserialization<br>• Use simple data structures in `getStaticProps` when possible<br>• Complex types may impact performance |

## Important Considerations

### Route Type Safety

```typescript
// Example of typed route usage
<Link
  href={{
    pathname: "/profile/[bpiId]",
    query: { bpiId: officerId }
  }}
>
  View Profile
</Link>
```

### Data Serialization

-   Keep data structures simple when possible
-   Monitor performance with complex types
-   Test serialization with large datasets
-   Use appropriate data transformation methods

# How to Add New Data

Updating the data for this project is very important and thus very common (at least annually). To accomplish this, previous engineers have gone to great lengths to make this as painless as possible.

**Please follow these steps to a T when adding new data to the website from PostgreSQL**

❓Ask a previous engineer for help if you have any questions as this is a very important process❓

## Creating a New Table

When adding a new dataset to the website, follow these steps in order:

| Step | File Location                           | Action Required                                                                                                                                                        |
| ---- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | `/utility/tableDefinitions`             | • Set `isFake` to `false`<br>• Add table query to appropriate array:<br>&nbsp;&nbsp;- `tablesFromAnalyzeBoston`, or<br>&nbsp;&nbsp;- `tablesFromPublicRecordsRequests` |
| 2    | `/lib/graphql/queries`                  | Create a new query named `GET_NEXT_PAGE_<query_table_name_here>`                                                                                                       |
| 3    | `/interfaces/dataResponseInterfaces.ts` | Add new interface for the response type                                                                                                                                |
| 4    | `/utility/queryUtils.ts`                | Add new cases in:<br>• `handleQuery`<br>• `executeDataPageQuery`                                                                                                       |
| 5    | `/utility/createMUIGrid.tsx`            | Add `description` for each column:<br>• For known definitions, add detailed description<br>• For unknown, use `description: ""`                                        |
| 6    | `/utility/queryUtils.ts`                | Add entry to `tableDateColumnMap` for date column                                                                                                                      |

## Updating a Table to a New View

When your backend engineer creates a new view with updated data, follow these steps:

| Step | File Location                 | Action Required                  | Notes                                                                                         |
| ---- | ----------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| 1    | `/utility/dataViewAliases.ts` | Update view names in aliases     | • Changes automatically reflect in `queries.ts`<br>• If schema changes, manual updates needed |
| 2    | `/utility/dataViewAliases.ts` | Add to `table_name_to_alias_map` | • Ensures proper routing and data fetching                                                    |

### Verification Steps

1. Run development server
2. Navigate to the updated table
3. Confirm data is loading correctly
4. Test all existing functionality (sorting, filtering, etc.)
5. Monitor for any performance changes

# Work to Be Done

This section outlines the current development priorities. For detailed task tracking, check the [Notion board](https://www.atlassian.com/agile/kanban/boards).

## Tasks

### 1. Performance Optimization

-   [ ] Implement page preloading for smoother pagination
-   [ ] Add background data loading for adjacent pages
-   [ ] Optimize GraphQL query execution

### 2. User Experience Improvements

-   [x] Complete UI redesign
-   [x] Implement mobile responsiveness
-   [x] Add drill-down functionality
-   [x] Implement comprehensive export feature
-   [ ] Add new data visualization options
-   [ ] Implement advanced search with autocomplete
-   [ ] Improve error messaging and user feedback

## Completed Features

**Recent Improvements:**

-   ✅ Complete UI/UX redesign
-   ✅ Mobile-responsive design implementation
-   ✅ Data drill-down functionality
-   ✅ Comprehensive export capabilities

## Remaining Improvements

-   [ ] Implement page preloading for smoother pagination
-   [ ] Add additional data visualization options
-   [ ] Implement advanced search features

## Known Issues

### 1. Data Calculation Standardization

**Priority: Medium**

**Problem:**  
Inconsistent percentile calculations between header and histogram displays.

**Solution:**
Standardizing percentile calculation across all components:

```typescript
percentile = (totalNumberOfRecordsBelowValue / totalNumberOfRecords) * 100;
```

### 2. Component Architecture

**Priority: Medium**

**Problem:**

-   Tight coupling between data visualization components and data structures
-   Inconsistent error handling patterns
-   Some components have hard-coded dimensions affecting responsiveness

**Solution:**

-   Refactor histogram data handling for better separation of concerns
-   Implement consistent error boundary pattern
-   Make components fully responsive with dynamic sizing

### 3. Performance Optimization

**Priority: High**

**Problem:**

-   Data loading and pagination performance bottlenecks
-   Suboptimal GraphQL query execution
-   Large dataset handling inefficiencies

**Solution:**

```typescript
// Implement data preloading pattern
const preloadAdjacentPages = async (currentPage: number) => {
	const pagesToPreload = [currentPage - 1, currentPage + 1];
	await Promise.all(pagesToPreload.map((page) => fetchPageData(page)));
};
```

### 4. Code Organization

**Priority: Low**

**Problem:**

-   Deprecated code in utility functions
-   Inconsistent documentation patterns
-   Missing test coverage for critical features

**Solution:**

-   Clean up utility functions and remove deprecated code
-   Standardize documentation format
-   Add unit and integration tests for data processing and visualization components
