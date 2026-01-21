# Database Schema Documentation

---

## Table: BPD Employees
**GraphQL View:** `allVwEmployeeRosterFall20252S`  
**Table Name:** `employee`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `bpiId` | string | Boston Police Index unique identifier |
| `employeeId` | number | The unique employee identifier |
| `firstName` | string | The first name of the employee |
| `jobTitle` | string | The job title or position of the employee |
| `lastName` | string | The last name of the employee |
| `nameId` | string | The formatted name identifier |
| `race` | string | The race of the employee |
| `salPlan` | string | The salary plan classification |
| `sex` | string | The sex of the employee |

---

## Table: Court Overtime
**GraphQL View:** `allVwCourtOvertimes`  
**Table Name:** `court_overtime`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `assignedDesc` | string | Description of the unit or department the officer is assigned to |
| `chargedDesc` | string | Description of the unit or department where overtime hours were charged |
| `bpiId` | string | Boston Police Index unique identifier |
| `description` | string | General description of the overtime purpose or type |
| `endTime` | number | End time of the overtime detail |
| `name` | string | Officer name |
| `otCode` | number | Code representing the specific court-related overtime activity |
| `otDate` | string | Date of the overtime detail |
| `rank` | string | Rank of the officer |
| `race` | string | Race of the officer |
| `sex` | string | Sex of the officer |
| `startTime` | number | Start time of the overtime detail |
| `workedHours` | number | Total number of hours worked during the overtime detail |

---

## Table: Crime Incident
**GraphQL View:** `allVwIncidentsWithOfficerDetailsWws`  
**Table Name:** `crime_incident`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `attributions` | string | Attribution information |
| `bagOfText` | string | Bag of text containing additional information |
| `bpiId` | string | Boston Police Index unique identifier (nullable) |
| `buiBadgeNo` | string | Badge number (nullable) |
| `buiNameId` | string | Name ID (nullable) |
| `buiOfficerId` | string | Officer ID (nullable) |
| `createdAt` | string | Timestamp when record was created |
| `district` | string | Police district where the incident occurred (nullable) |
| `exceptionalClearanceDate` | string | Date of exceptional clearance (nullable) |
| `geocodeLatitude` | number | Geocoded latitude coordinate |
| `geocodeLongitude` | number | Geocoded longitude coordinate |
| `id` | string | Unique identifier for the incident |
| `incidentClearance` | string | Incident clearance status (nullable) |
| `incidentNumber` | number | Unique incident number |
| `latitude` | number | Latitude coordinate of the incident location |
| `locationOfOccurrence` | string | Description of where the incident occurred |
| `locationType` | string | Type of location where the incident occurred (nullable) |
| `longitude` | number | Longitude coordinate of the incident location |
| `nibrsOffenses` | string | NIBRS offense information (nullable) |
| `natureOfIncident` | string | Description of the type of incident |
| `numberOfArrestees` | number | Number of people arrested (nullable) |
| `numberOfOffenders` | number | Number of offenders involved (nullable) |
| `numberOfVictims` | number | Number of victims involved (nullable) |
| `occurredOnDate` | string | The date when the incident occurred |
| `offenses` | string | Description of the offenses involved (nullable) |
| `officerId` | string | Unique identifier for the officer involved |
| `officerJournalName` | string | Name of the officer from the journal |
| `reportDate` | string | The date when the incident was reported |
| `reportedLatitude` | number | Reported latitude coordinate (nullable) |
| `reportedLongitude` | number | Reported longitude coordinate (nullable) |
| `reportingArea` | string | Reporting area (nullable) |
| `shooting` | boolean | Whether the incident involved a shooting (nullable) |
| `street` | string | Street where the incident occurred (nullable) |

---

## Table: Detail Record
**GraphQL View:** `allVwDetailRecords`  
**Table Name:** `detail_record`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `adminFeeFlag` | string | Admin fee flag ("Y" or "N") |
| `badgeNo` | number | Officer badge number (not necessarily unique) |
| `bpdCustomerNo` | number | BPD customer number |
| `bpiId` | string | Boston Police Index unique identifier |
| `customerNo` | number | Customer number |
| `customerSeq` | number | Customer sequence number |
| `customerName` | string | Name of the customer or entity requesting services |
| `detailRank` | number | Rank of the officer during detail |
| `detailType` | string | Type of detail (C = construction, S = standard) |
| `districtWorked` | number | District code where the employee worked |
| `empRank` | number | Employee rank |
| `empOrgCode` | number | 5-digit code assigned to each organization within BPD |
| `endTime` | string | End time of the detail |
| `hoursWorked` | number | Number of hours worked |
| `nameId` | string | Officer name identifier |
| `noShowFlag` | string | Flag indicating if the assigned officer failed to show ("Y" or "N") |
| `payAmount` | number | Amount the officer was paid for this detail work |
| `payHours` | number | Number of hours officer was paid for |
| `payRate` | number | Rate per hour the officer was paid |
| `payTrcCode` | string | Transaction code for payment processing |
| `race` | string | Race of the officer |
| `sex` | string | Sex of the officer |
| `startDate` | string | Date the detail work took place |
| `startTime` | string | Start time of the detail |
| `stateFunded` | string | Flag indicating if the detail is state-funded ("Y" or "N") |
| `street` | string | Street name where the detail was done |
| `streetNo` | string | Street number of the detail location |
| `trackingNo` | number | Unique tracking number assigned to each detail or request |
| `xstreet` | string | Cross street name |

---

## Table: Field Interrogation & Observations
**GraphQL View:** `allVwFieldInterrogationAndObservations`  
**Table Name:** `fio_record`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `basis` | string | Circumstances of field contact (Observed, Encountered, Stopped) |
| `bpiId` | string | Boston Police Index unique identifier |
| `circumstance` | string | Basis for field contact (Encounter, Intel, Reasonable Suspicion, Probable Cause) |
| `city` | string | City where stop occurred |
| `contactDate` | string | Date on which the stop occurred |
| `contactOfficerName` | string | Officer's name |
| `fcNum` | string | Field Contact Number |
| `frisked` | string | Whether or not an officer performed a frisk (boolean) |
| `keySituations` | string | What happened in the event and what was present |
| `narrative` | string | Reasons for Interrogation, Observation, Frisk, or Search |
| `state` | string | State where stop occurred |
| `stopDuration` | string | Length of stop (time) |
| `streetAddress` | string | The street address where the encounter happened |
| `summonsIssued` | string | Indicates if a summons was issued (boolean) |
| `supervisorName` | string | Supervisor's name |
| `vehicleColor` | string | Vehicle color |
| `vehicleMake` | string | Vehicle make |
| `vehicleModel` | string | Vehicle model |
| `vehicleSearched` | string | Indicates if a vehicle was searched (boolean) |
| `vehicleState` | string | Vehicle registration state |
| `vehicleStyle` | string | Vehicle style (e.g., Passenger Car or pickup truck) |
| `vehicleType` | string | Type of Vehicle (Sedan, Compact Car, SUV, Utility Vehicle) |
| `vehicleYear` | number | Vehicle year |
| `weather` | string | The weather of the day |
| `zip` | string | Zip code of where the stop happened |

---

## Table: Traffic Stops
**GraphQL View:** `allVwTrafficStopsFall2025S`  
**Table Name:** `traffic_stop`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `amPm` | string | Time of day (AM or PM) |
| `bpiId` | string | Boston Police Index unique identifier |
| `citationNumber` | string | Unique citation number issued for the traffic stop |
| `citationType` | string | Type of citation issued (e.g., WARN, CITATION) |
| `crash` | string | Whether a crash was involved (Y/N) |
| `eventDate` | string | Date when the traffic stop occurred |
| `gender` | string | Gender of the individual stopped |
| `locationName` | string | Location where the traffic stop occurred |
| `officerId` | number | Officer identification number |
| `offenseCode` | string | Code for the traffic offense |
| `offenseDescription` | string | Description of the traffic offense |
| `race` | string | Race of the individual stopped |
| `searched` | string | Whether a search was conducted during the stop (Y/N) |
| `timeHh` | string | Hour of the traffic stop |
| `timeMm` | string | Minute of the traffic stop |
| `violatorType` | string | Type of violator (e.g., OPERATOR, PEDESTRIAN) |
| `yearOfBirth` | string | Birth year of the individual stopped |

---


## Table: Officer Misconduct (IAs)
**GraphQL View:** `allVwEmployeeIaFall2025S`  
**Table Name:** `officer_misconduct` / `officer_ia`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `actionTaken` | string | Disciplinary or corrective actions imposed if the allegation was substantiated |
| `allegation` | string | The specific accusation or complaint made against the officer(s) |
| `allegationDetails` | string | Detailed information or context about the allegation (legacy) |
| `allegationSubtype` | string | A more detailed categorization of the allegation (legacy) |
| `allegationType` | string | A broader categorization of the allegation (legacy) |
| `badgeNo` | number | The badge number of an officer (not necessarily unique) |
| `bpiId` | string | Boston Police Index unique identifier |
| `daysHoursSuspended` | string | The number of days or hours the officer was suspended |
| `disciplines` | string | Any disciplinary categories relevant to the case (legacy) |
| `disposition` | string | The final status of the case (legacy) |
| `employeeId` | number | Employee ID |
| `finding` | string | The outcome of the investigation (e.g., sustained, not sustained, exonerated, unfounded) |
| `firstName` | string | First name of the officer |
| `iaNumber` | string | Internal Affairs case number assigned to track the investigation |
| `incidentType` | string | The general category of the reported event |
| `lastName` | string | Last name of the officer |
| `leaDisposition` | string | The final disposition as determined by the Law Enforcement Agency (legacy) |
| `occuredDate` | string | The actual date on which the incident occurred (legacy) |
| `race` | string | Race of the officer |
| `rank` | string | Rank of the officer (legacy) |
| `receivedDate` | string | The date when the complaint or investigation was officially received |
| `sex` | string | Sex of the officer |
| `titleRank` | string | Title/rank of the officer |

---

## Table: Boston Arrests
**GraphQL View:** `allVwBostonArrests`  
**Table Name:** `boston_arrest`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `age` | number | Age of the arrested individual at time of arrest |
| `arrestNum` | string | Unique identifier for the arrest record |
| `arrDate` | string | Date when the arrest occurred |
| `chargeCode` | string | Legal code for the charge |
| `chargeDesc` | string | Description of the criminal charge |
| `chargeSeqNum` | number | Sequence number for multiple charges in same arrest |
| `dayOfWeek` | number | Day of week when arrest occurred |
| `district` | string | Police district where arrest occurred |
| `ethnicityDesc` | string | Ethnicity of the arrested individual |
| `genderDesc` | string | Gender of the arrested individual |
| `hourOfDay` | number | Hour of day when arrest occurred (0-23) |
| `incNum` | string | Incident number associated with the arrest |
| `juvenile` | string | Whether the arrested individual was a juvenile |
| `month` | number | Month when arrest occurred |
| `neighborhood` | string | Neighborhood where arrest occurred |
| `nibrsCode` | string | National Incident-Based Reporting System code |
| `nibrsDesc` | string | Description of the NIBRS offense category |
| `objectid` | string | Object identifier for the arrest record |
| `pkey` | number | Primary key |
| `quarter` | number | Quarter of year when arrest occurred |
| `raceDesc` | string | Race of the arrested individual |
| `year` | number | Year when arrest occurred |

---

## Table: Incident Report
**GraphQL View:** `allVwIrFall2025S`  
**Table Name:** `ir_fall_2025`

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `allAssistingOfficersAndAssistTypes` | string | All assisting officers and their assistance types (nullable) |
| `badgeNo` | number | Badge number of the reporting officer |
| `bpiId` | string | Boston Police Index unique identifier |
| `chargeI` | string | First charge filed (nullable) |
| `chargeIi` | string | Second charge filed (nullable) |
| `chargeIii` | string | Third charge filed (nullable) |
| `date` | string | Date when the incident occurred |
| `eventDistrict` | string | Police district where the event occurred (nullable) |
| `eventLocationCrossStreet1` | string | First cross street for the event location (nullable) |
| `eventLocationCrossStreet2` | string | Second cross street for the event location (nullable) |
| `eventLocationNeighborhood` | string | Neighborhood where the event occurred (nullable) |
| `eventLocationStreetAddress` | string | Street address where the event occurred (nullable) |
| `eventNeighborhood` | string | Neighborhood classification for the event (nullable) |
| `offenseLocationCrossStreet1` | string | First cross street for the offense location (nullable) |
| `offenseLocationCrossStreet2` | string | Second cross street for the offense location (nullable) |
| `offenseLocationLat` | string | Latitude coordinate of the offense location (nullable) |
| `offenseLocationLong` | string | Longitude coordinate of the offense location (nullable) |
| `offenseLocationNeighborhood` | string | Neighborhood where the offense occurred (nullable) |
| `officerName` | string | Name of the reporting officer |
| `reportingOfficer` | string | Full name and badge number of the reporting officer |
| `shooting` | string | Whether a shooting was involved in the incident (nullable) |
| `suspectCount` | string | Number of suspects involved in the incident (nullable) |
| `time` | string | Time when the incident occurred (nullable) |
| `totalCharges` | string | Total number of charges filed (nullable) |
| `weaponForceInvolved` | string | Information about weapons or force involved (nullable) |

---

## Table: Officer Earnings
**GraphQL View:** `allVwEmployeeFinancials`  
**Table Name:** `police_financial` (not a direct database table)  
**Where Used:** Individual officer profile pages (`/profile/[bpiId]`)  
**Purpose:** Detailed year-by-year financial breakdown for a specific officer

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `badgeNo` | number | Officer badge number |
| `detailPay` | number | Earnings from detail work |
| `firstName` | string | First name of the officer |
| `injuredPay` | number | Earnings while injured |
| `lastName` | string | Last name of the officer |
| `otPay` | number | Overtime pay |
| `otherPay` | number | Other forms of pay |
| `quinnPay` | number | Earnings from the Quinn Bill educational incentive program |
| `race` | string | Race of the officer |
| `rank` | string | Rank of the officer |
| `regularPay` | number | Regular base pay |
| `retroPay` | number | Retroactive pay |
| `sex` | string | Sex of the officer |
| `totalPay` | number | Total pay (calculated from other pay fields) |
| `totalPayPercentile` | number | Percentile ranking of total pay |
| `unionCode` | string | Union code |
| `unit` | string | Unit assignment |
| `year` | number | Year of the financial record |
| `zipCode` | string | Zip code |

**Note:** This view is filtered by `bpiId` when queried, returning all years of financial data for a single officer. Used to display the "Police Earnings" table on individual officer profile pages, showing year-by-year earnings breakdown with visualizations.

---

## Table: Homepage 
**GraphQL View:** `allHomepages`  
**Table Name:** `homepage` (not a direct database table - aggregated view)  
**Where Used:** Main homepage (`/`) officer search table  
**Purpose:** Summary/aggregated data for all officers in a searchable list

### Fields
| Field Name | Type | Description |
|------------|------|-------------|
| `badgeNo` | number | Officer badge number |
| `bpiId` | string | Boston Police Index unique identifier |
| `detailPay` | number | Total detail pay (aggregated) |
| `employeeId` | number | Employee ID |
| `fullName` | string | Full name of the officer |
| `numOfIa` | number | Number of Internal Affairs complaints |
| `org` | string | Organization code |
| `otherPay` | number | Other forms of pay (aggregated) |
| `overtimePay` | number | Overtime pay (aggregated) |
| `rank` | string | Rank of the officer |
| `race` | string | Race of the officer |
| `sex` | string | Sex of the officer |
| `totalPay` | number | Total pay (aggregated) |
| `year` | number | Year (typically most recent year) |

**Note:** This is an aggregated view showing one row per officer with summary financial data. Used to populate the searchable officer database table on the homepage. Contains fewer detailed fields than the Officer Earnings table but includes summary statistics like `numOfIa` (number of IA complaints). The financial fields are aggregated totals rather than year-by-year breakdowns.

---