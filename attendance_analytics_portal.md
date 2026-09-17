# Attendance Analytics Portal --- Product & Engineering Brief for Antigravity

## 1. Vision

Build a web-based Attendance Analytics Portal where Excel attendance
sheets are treated as the source of truth, while the application
converts those sheets into structured, searchable, historical attendance
intelligence.

The portal should not behave like an Excel viewer. A user should be able
to upload an attendance sheet, let the system understand what institute,
program, branch, division, semester and attendance period the sheet
belongs to, confirm the detected information, and then allow the
application to process the sheet into a permanent database record. Every
upload must remain historically traceable. When another sheet for the
same academic context is uploaded later, the system must compare the new
dataset with previous datasets and identify students who are new, still
present, or missing from the latest upload.

Use **Next.js** for the application. The application should be designed
as a production-quality full-stack web portal with a clean, modern
analytics interface. The architecture should separate file storage,
normalized database records, upload snapshots, student identity and
analytics.

The first version should be designed around the uploaded attendance
spreadsheet structure, but the parser must not be so fragile that it
only works for one exact Excel file. It should recognize the relevant
headers and data patterns and provide a confirmation/edit step whenever
automatic detection is uncertain.

------------------------------------------------------------------------

## 2. The Core Story of the Product

Imagine an administrator receives an attendance Excel sheet from an
institute. They open the Attendance Analytics Portal and see a clear
upload area. They drag the Excel file into the portal. At this point,
the portal does not immediately dump the spreadsheet into a table or
overwrite any previous data.

Instead, the application first receives the file, validates it, reads
its workbook and identifies the structure of the spreadsheet. It tries
to understand the context of the data: which institute it belongs to,
which program and branch it represents, which division is involved,
which semester is covered, which academic year it belongs to, what
attendance period the sheet represents, how many students are present in
the file, and which subjects are represented.

Once the system has interpreted the sheet, it presents a confirmation
screen. The user sees something like: Institute: SOE, Program: B.Tech,
Branch: CSE, Division: 3B, Semester: 3, Academic Year: 2026--27,
Attendance Period: 08 June 2026 to 31 August 2026, Students: 58,
Subjects: 10. The user can confirm the detected information or edit
anything that is incorrect. Only after confirmation should the
application commit the processed dataset.

This confirmation step is important because the spreadsheet is external
input and should never be blindly trusted. The system can automatically
detect metadata, but the user remains the final authority before a
dataset becomes part of the official portal history.

After confirmation, the application creates an upload record. This
upload represents one specific snapshot of attendance data at a
particular point in time. The original Excel file is preserved in file
storage, while the extracted and normalized information is stored in the
database. The database should never depend on repeatedly parsing the
original Excel file for normal dashboard operations.

The system then walks through the student rows. Each student is
identified primarily through their Enrollment Number. Names should not
be treated as the primary identity because names can be duplicated or
formatted differently. If an enrollment number already exists in the
database, the system connects the new attendance data to the existing
student. If the enrollment number does not exist, the application
creates a new student record.

The attendance information is then stored as a historical record
associated with that upload snapshot and student. Subject-level
attendance should also be preserved rather than storing only one final
percentage. This allows the portal to show both overall attendance and
subject-wise attendance later.

The most important part happens after the current sheet has been
normalized. The system finds the most recent comparable dataset for the
same institute, program, branch, division, semester and academic year.
It compares the student enrollment numbers from the previous snapshot
with the enrollment numbers in the current snapshot. If a student
existed in the previous dataset but is not present in the new sheet, the
student is not deleted. Instead, the system records that the student was
missing from the latest dataset and retains the last date on which
attendance data was successfully received for that student.

If a student appears for the first time, the system identifies them as a
new student. If a student existed previously and appears again, the
system treats the new row as another historical attendance observation
for that student.

Once processing finishes, the portal produces a meaningful upload
summary. It can report the number of students processed, number of
subjects detected, matched students, new students, missing students,
invalid records and other validation warnings. The user can then open
the Command Centre and immediately analyze the new dataset.

The same process repeats every time a new sheet is uploaded. This means
the database becomes a timeline of attendance snapshots rather than a
single overwritten attendance table.

------------------------------------------------------------------------

# 3. Technology Direction

The application must be built using **Next.js**.

Use a modern Next.js App Router architecture. Prefer TypeScript
throughout the project.

The system should be structured so that UI, server-side processing,
database operations and storage operations are clearly separated.

Recommended high-level stack:

-   Next.js with App Router
-   TypeScript
-   Tailwind CSS
-   A component system suitable for building a polished analytics
    dashboard
-   Supabase for PostgreSQL database, file storage and authentication if
    authentication is required
-   Excel parser capable of reading both `.xls` and `.xlsx`
-   Server-side processing for spreadsheet parsing and normalization
-   API routes or Server Actions for controlled mutations
-   Database transactions for upload processing
-   Strong validation using a schema validation library such as Zod

The UI must remain responsive and should work well on desktop first,
while still adapting to tablet-sized screens.

------------------------------------------------------------------------

# 4. Application Structure

The application should conceptually contain three major product modules:

1.  **Information**
2.  **Command Centre**
3.  **Student Intelligence**

There should also be a dedicated **Upload / Import workflow**, because
uploading is the process that feeds all three modules.

A possible route structure is:

``` text
/
  Dashboard / Command Centre

/upload
  Upload Attendance Sheet

/upload/review
  Review detected metadata

/uploads
  Upload history

/information
  Dataset information

/students
  Student Intelligence

/students/[studentId]
  Student detail and history

/analytics
  Attendance analytics

/settings
  Application configuration
```

The exact route names can be changed if a better UX architecture is
found, but the separation of concerns should remain.

------------------------------------------------------------------------

# 5. Upload Workflow --- Detailed Product Behaviour

## Stage 1: File Selection

The upload screen should be visually simple.

The primary action should be:

**Upload Attendance Sheet**

The user should be able to drag and drop a file or browse for one.

Supported formats in the first version:

-   `.xls`
-   `.xlsx`

The UI should clearly communicate that the file will be analyzed before
being imported.

When a file is selected, show:

-   file name
-   file size
-   file type
-   upload progress
-   remove/cancel option

Do not start permanent database processing before the file passes basic
validation.

------------------------------------------------------------------------

## Stage 2: File Validation

After selection, the backend should validate the file.

Check:

-   supported extension
-   readable workbook
-   at least one usable worksheet
-   presence of student-related columns
-   presence of an enrollment number or equivalent identity field
-   presence of student name
-   presence of attendance information
-   duplicate or previously imported file where detectable
-   suspiciously empty worksheet
-   malformed rows

If validation fails, show a human-readable error.

Do not expose raw parser exceptions to the user.

For example:

Bad:

> TypeError: Cannot read property 'x' of undefined

Good:

> We could not identify the student attendance columns in this
> spreadsheet. Please verify that the sheet contains Enrollment Number,
> Student Name and attendance data.

------------------------------------------------------------------------

# 6. Stage 3: Metadata Detection

Once the workbook is readable, the application should inspect the sheet
structure.

It should attempt to detect:

-   Institute
-   Program
-   Branch
-   Division
-   Semester
-   Academic Year
-   Attendance start date
-   Attendance end date
-   Student count
-   Subject count
-   Subject names
-   Relevant attendance columns

The uploaded spreadsheet contains contextual information in its
headings, and the parser should use this information when available.

However, do not hard-code one exact header position.

Instead, create a normalization layer that can handle:

-   title rows
-   merged cells
-   blank rows
-   multiple header rows
-   slightly different naming conventions
-   extra formatting rows
-   subject sections

The parser should produce an internal normalized representation.

For example:

``` ts
{
  metadata: {
    institute: "SOE",
    program: "B.Tech",
    branch: "CSE",
    division: "3B",
    semester: 3,
    academicYear: "2026-27",
    periodStart: "2026-06-08",
    periodEnd: "2026-08-31"
  },
  subjects: [...],
  students: [...]
}
```

This object is only an intermediate representation. It should then be
validated before database insertion.

------------------------------------------------------------------------

# 7. Stage 4: Review and Confirmation

The user should see a dedicated review screen.

The purpose of this screen is to make the import transparent.

Display a dataset summary:

``` text
Institute
SOE

Program
B.Tech

Branch
CSE

Division
3B

Semester
3

Academic Year
2026-27

Attendance Period
08 Jun 2026 — 31 Aug 2026

Students Detected
58

Subjects Detected
10
```

Also show detected subject names.

The user should be able to edit metadata.

The screen should visually distinguish:

-   detected automatically
-   confirmed by user
-   warnings
-   errors

If the parser is uncertain about something, explicitly mark it.

For example:

> Division could not be confidently detected.

Then provide a dropdown or input for the user to select the correct
division.

The final action should be:

**Confirm & Process**

Do not allow processing while critical validation errors remain.

------------------------------------------------------------------------

# 8. Stage 5: Create Upload Snapshot

When the user clicks Confirm & Process, create an upload/snapshot
record.

Conceptually:

``` text
Upload
├── unique upload ID
├── original filename
├── storage path
├── uploaded timestamp
├── uploaded by
├── institute
├── program
├── branch
├── division
├── semester
├── academic year
├── period start
├── period end
├── detected student count
├── detected subject count
└── processing status
```

The processing status can move through:

``` text
uploaded
processing
completed
completed_with_warnings
failed
```

This gives the system traceability and makes long-running processing
easier to monitor.

------------------------------------------------------------------------

# 9. Stage 6: Store the Original Excel File

The original Excel file must be retained.

Do not store the binary Excel file inside normal relational attendance
tables.

Use file/object storage.

The database should contain a reference to the stored file.

Conceptually:

``` text
Storage
  /attendance-uploads/
    /2026-27/
      /SOE/
        /CSE/
          /3B/
            /upload-001.xls
            /upload-002.xls
```

The exact physical storage path can be generated from IDs instead of
names if that is safer, but the logical organization should remain
clear.

The original file should be immutable after upload.

If the user uploads a corrected sheet, it should create a new upload
snapshot rather than silently replacing the old file.

------------------------------------------------------------------------

# 10. Stage 7: Student Identity Resolution

This is one of the most important pieces of the application.

The system should use **Enrollment Number as the primary student
identity key**.

Example:

``` text
25SE02CS080
```

If the same enrollment number appears in multiple uploads, it refers to
the same student unless an explicit administrative correction is made.

The student name can be stored as an attribute, but should not be the
main matching key.

If an enrollment number is missing, the record should be flagged for
review instead of confidently creating a duplicate student.

If two students appear to conflict, the system should show an import
warning.

Example:

> Enrollment Number 25SE02CS080 appears with a different student name in
> the new sheet.

Do not silently merge conflicting identities.

------------------------------------------------------------------------

# 11. Stage 8: Attendance Normalization

The spreadsheet may contain many columns and subject-level values.

The parser should convert those values into normalized attendance
records.

Conceptually:

``` text
Student
  ↓
Attendance Snapshot
  ↓
Subject Attendance
  ├── Conducted
  ├── Present
  ├── Absent
  └── Percentage
```

The system should preserve raw numerical values where possible.

For example:

``` text
conducted = 31
present = 28
absent = 3
percentage = 90.32
```

If percentage can be calculated from conducted and present, the system
can validate the spreadsheet's percentage.

If there is a mismatch, do not automatically overwrite the source value
without recording the discrepancy.

------------------------------------------------------------------------

# 12. Stage 9: Compare With Previous Snapshot

After normalization, determine the comparable previous dataset.

The comparison context should normally be based on:

-   Institute
-   Program
-   Branch
-   Division
-   Semester
-   Academic Year

Do not compare unrelated divisions or different academic years.

Suppose:

Previous snapshot:

``` text
58 students
```

Current snapshot:

``` text
57 students
```

The system compares enrollment numbers.

Previous:

``` text
A
B
C
D
E
```

Current:

``` text
A
B
C
E
```

The result is:

``` text
D = missing from latest snapshot
```

This does not mean D has left the institute.

It only means:

> D was present in the previous uploaded dataset but is not present in
> the latest uploaded dataset.

The UI language should reflect this distinction.

Use:

**Missing from latest dataset**

instead of:

**Student left**

because the portal cannot infer why a student is absent from an Excel
sheet.

------------------------------------------------------------------------

# 13. New Student Detection

If the current snapshot contains an enrollment number that was not
present in the comparable previous snapshot, mark it as a new record
relative to that snapshot.

Example:

Previous:

``` text
58 students
```

Current:

``` text
60 students
```

The system might report:

``` text
58 existing students matched
2 new students detected
```

The students are then added to the master student table if they do not
already exist globally.

------------------------------------------------------------------------

# 14. Missing Student History

Every student should have a historical timeline.

For example:

``` text
Student: Karan

31 Aug 2026
Attendance data received
Status: Present in dataset

07 Sep 2026
Attendance data not found
Status: Missing from latest dataset

14 Sep 2026
Attendance data received
Status: Present in dataset
```

The portal should preserve all three events.

The student's profile can show:

**Last Data Received: 31 Aug 2026**

while the latest upload may show:

**Missing from latest dataset**

If the student appears again later, the latest date updates
automatically.

------------------------------------------------------------------------

# 15. Database Architecture

Use a relational database.

Recommended core entities:

``` text
institutes
programs
branches
divisions
students
subjects
uploads
attendance_records
attendance_subject_records
```

Depending on implementation, programs, branches and divisions can also
be represented through normalized relationships rather than plain
strings.

A conceptual structure:

``` text
Institute
   ↓
Program
   ↓
Branch
   ↓
Division
   ↓
Students

Upload
   ↓
Attendance Records
   ↓
Student
   ↓
Subject
```

Every attendance record should be traceable back to its source upload.

This is critical for auditability.

------------------------------------------------------------------------

# 16. Recommended Database Relationships

A student can have many attendance records.

An upload contains many attendance records.

A subject can appear in many attendance records.

Therefore:

``` text
students
   1 ──────── many attendance_records

uploads
   1 ──────── many attendance_records

subjects
   1 ──────── many attendance_subject_records
```

The exact schema can be optimized during implementation, but historical
traceability must remain.

------------------------------------------------------------------------

# 17. Upload History

Create an Upload History screen.

It should show every imported file.

Example:

  --------------------------------------------------------------------------------
  Upload       Institute   Branch    Division       Students Period     Uploaded
  ------------ ----------- --------- ---------- ------------ ---------- ----------
  upload-001   SOE         CSE       3B                   58 Jun--Aug   08 Sep

  upload-002   SOE         CSE       3B                   57 Sep        15 Sep
  --------------------------------------------------------------------------------

Clicking an upload should open its details.

The user should be able to see:

-   original filename
-   upload date
-   uploader
-   metadata
-   number of students
-   subjects
-   processing result
-   warnings
-   missing students
-   new students
-   original file reference

------------------------------------------------------------------------

# 18. Information Module

The Information module is a refined representation of the uploaded
dataset.

It should not simply reproduce the Excel formatting.

It should show:

### Dataset Overview

-   Institute
-   Program
-   Branch
-   Division
-   Semester
-   Academic Year
-   Attendance period
-   Number of students
-   Number of subjects
-   Last uploaded time
-   Source file

### Subject Overview

Show all subjects detected in the dataset.

### Data Quality

Show warnings such as:

-   missing enrollment number
-   duplicate enrollment number
-   invalid attendance percentage
-   inconsistent student name
-   missing subject value
-   unexpected column
-   incomplete row

This turns the upload into a trustworthy dataset rather than just a
file.

------------------------------------------------------------------------

# 19. Command Centre

The Command Centre is the primary analytics screen.

The page should open with high-level metrics and then provide a powerful
student table.

Example metrics:

``` text
Total Students
1,284

Average Attendance
82.4%

Below 75%
183

Below 60%
47

Above 90%
391

Latest Dataset
08 Sep 2026
```

These values should always be calculated from database records and
should update according to the selected filters.

------------------------------------------------------------------------

# 20. Command Centre Filters

The filter system should be powerful but easy to understand.

Primary filters:

-   Institute
-   Program
-   Branch
-   Division
-   Semester
-   Academic Year
-   Subject
-   Attendance percentage
-   Attendance status
-   Last data received
-   Dataset/upload

Attendance percentage can provide range presets:

``` text
Below 60%
60–74%
75–84%
85–89%
90–100%
```

Also allow a custom range.

Filters should work together.

Example:

``` text
Institute = SOE
Branch = CSE
Division = 3B
Attendance < 75%
```

The table then shows only students matching all conditions.

------------------------------------------------------------------------

# 21. Student Table

The main Command Centre table should contain:

``` text
Enrollment Number
Student Name
Institute
Branch
Division
Attendance %
Status
Last Data Received
```

Optional columns can be shown through a column selector.

Rows should be sortable.

The table should support pagination or virtualized rendering for large
datasets.

Do not load thousands of records into the browser unnecessarily.

Filtering and sorting should preferably happen server-side when datasets
become large.

Clicking a student opens the Student Intelligence detail page.

------------------------------------------------------------------------

# 22. Attendance Status

Create consistent status rules.

For example:

``` text
90–100%   Excellent
85–89%    Good
75–84%    Safe
60–74%    At Risk
Below 60% Critical
```

These thresholds should be configurable rather than hard-coded into
every component.

The UI should use clear visual status indicators.

Do not rely on color alone; always include text or icons for
accessibility.

------------------------------------------------------------------------

# 23. Student Intelligence Module

The Student Intelligence module should answer one question:

> What do we know about this student across all uploaded attendance
> data?

A student profile should contain:

### Identity

-   Name
-   Enrollment Number
-   Institute
-   Program
-   Branch
-   Division
-   Semester

### Current Attendance

-   overall percentage
-   subject-wise attendance
-   present
-   absent
-   conducted

### History

Show all relevant snapshots chronologically.

### Data Presence

Show whether the student appeared in each comparable upload.

Example:

``` text
08 Sep 2026    Present
15 Sep 2026    Present
22 Sep 2026    Missing
29 Sep 2026    Present
```

### Last Data Received

Show the most recent date where the portal received attendance data for
that student.

------------------------------------------------------------------------

# 24. Historical Comparison

The portal should eventually support comparing two snapshots.

Example:

``` text
Previous Attendance: 84.2%
Current Attendance: 81.7%

Change: -2.5 percentage points
```

For a group:

``` text
Previous Average: 84.2%
Current Average: 82.8%
Change: -1.4 points
```

Also show:

-   students who improved
-   students whose attendance dropped
-   students who crossed below a threshold
-   students who crossed above a threshold
-   new students
-   missing students

------------------------------------------------------------------------

# 25. Upload Result Summary

After processing an upload, show a dedicated result page or modal.

Example:

``` text
Attendance Sheet Processed

58 students processed
10 subjects detected

57 students matched
1 student missing
2 new students
3 warnings
```

The user should have:

**View Command Centre**

and

**View Upload Details**

as primary next actions.

------------------------------------------------------------------------

# 26. Duplicate Upload Handling

The application must detect duplicate imports where possible.

A duplicate can be identified through a combination of:

-   file hash
-   filename
-   dataset metadata
-   attendance period
-   student set
-   attendance values

If the exact same file is uploaded again, show:

> This file appears to have already been imported.

Provide options such as:

**Cancel**

or

**Review Existing Upload**

Do not silently create duplicate attendance records.

If the user intentionally uploads a corrected version, allow it as a new
upload/revision with a clear audit trail.

------------------------------------------------------------------------

# 27. Error Handling and Data Safety

The upload process must be safe.

Never partially import a broken dataset.

Use a transactional approach:

1.  Create upload record.
2.  Validate parsed dataset.
3.  Resolve students.
4.  Prepare attendance records.
5.  Validate all records.
6.  Commit the complete dataset.
7.  Mark upload as completed.

If a critical error occurs, roll back the database transaction and mark
the upload as failed.

The original file can remain in storage for debugging/audit purposes.

------------------------------------------------------------------------

# 28. Performance Expectations

The application should be designed so that uploading a spreadsheet does
not freeze the UI.

The UI should show a processing state.

For larger spreadsheets, processing should be asynchronous if necessary.

The browser should not perform heavy Excel parsing if it can be avoided.
Prefer server-side processing.

The dashboard should query only the data it needs.

Use indexes for fields commonly used in filtering:

-   enrollment number
-   institute
-   branch
-   division
-   semester
-   academic year
-   upload ID
-   student ID
-   attendance percentage where appropriate

------------------------------------------------------------------------

# 29. UI/UX Direction

The interface should feel like a modern analytics/control platform
rather than an academic Excel management tool.

Use:

-   clean spacing
-   strong typography
-   restrained visual hierarchy
-   cards for high-level metrics
-   dense but readable tables
-   clear filters
-   breadcrumbs/context indicators
-   upload status indicators
-   empty states
-   loading skeletons
-   confirmation dialogs
-   error states
-   success states

The Command Centre should prioritize information density without
becoming visually chaotic.

The portal should always make the current context obvious.

For example:

``` text
SOE / B.Tech / CSE / 3B / Semester 3
```

should be visible when relevant.

------------------------------------------------------------------------

# 30. Important UX Principle: Context First

Attendance data without context is dangerous.

A percentage like `78%` is not meaningful unless we know:

-   which student
-   which institute
-   which branch
-   which division
-   which semester
-   which subject
-   which attendance period

Therefore the UI should consistently preserve dataset context.

Do not show an ambiguous global attendance number without identifying
what population and time period it represents.

------------------------------------------------------------------------

# 31. Data Model Philosophy

There are three different concepts and they must not be mixed.

### Student

The permanent identity.

### Upload/Snapshot

A specific imported dataset at a specific point in time.

### Attendance Record

The attendance information extracted from a specific snapshot for a
specific student/subject.

The relationship should conceptually be:

``` text
Student
   ↓
appears in
   ↓
Upload Snapshot
   ↓
contains
   ↓
Attendance Records
```

This prevents the common mistake of overwriting the current attendance
and losing historical context.

------------------------------------------------------------------------

# 32. Example End-to-End Scenario

Consider the first upload.

The administrator uploads:

``` text
CSE_3B_August.xls
```

The portal identifies:

``` text
SOE
B.Tech
CSE
3B
Semester 3
2026-27
08 Jun – 31 Aug
58 students
```

The user confirms it.

The system stores the original file and creates Snapshot #001.

The system creates or matches all 58 students and stores their
attendance.

A week later, the administrator uploads:

``` text
CSE_3B_September.xls
```

The system identifies the same academic context.

This time the sheet contains 57 students.

The system compares the 57 current enrollment numbers against the
previous 58.

It finds that one student is absent from the current sheet.

The database keeps that student's historical record.

The new upload is saved as Snapshot #002.

The upload result says:

``` text
57 students processed
56 existing students matched
1 student missing from latest dataset
```

The Command Centre now uses Snapshot #002 for the latest current view.

The Student Intelligence page for the missing student still shows the
student's previous attendance and:

``` text
Last Data Received:
31 Aug 2026

Latest Dataset:
Not found
```

Later, the student appears again in Snapshot #003.

The system recognizes the enrollment number, adds the new attendance
record and changes the latest presence state back to present.

Nothing from the historical timeline is deleted.

This is the central behaviour of the entire application.

------------------------------------------------------------------------

# 33. What Antigravity Should Not Build

Do not build this as a simple CRUD table where uploading an Excel file
replaces the previous dataset.

Do not identify students primarily by name.

Do not delete students simply because they are missing from a new sheet.

Do not store only the latest attendance percentage.

Do not discard the original uploaded files.

Do not hard-code the exact row numbers of the provided spreadsheet.

Do not assume that every future spreadsheet will have identical
formatting.

Do not silently fix conflicting student identities.

Do not silently overwrite an existing upload.

Do not make the Command Centre dependent on client-side filtering of
huge datasets.

Do not expose raw parser/database errors to users.

------------------------------------------------------------------------

# 34. First Implementation Priority

Build the first version in this order:

### Phase 1 --- Foundation

Set up Next.js, TypeScript, styling system, database connection and
storage.

### Phase 2 --- Upload Engine

Build Excel upload, validation, parsing and metadata detection.

### Phase 3 --- Confirmation

Build the detected metadata review screen.

### Phase 4 --- Database

Implement student, upload, subject and attendance relationships.

### Phase 5 --- Snapshot Comparison

Implement existing/new/missing student detection.

### Phase 6 --- Information Module

Build dataset overview and upload details.

### Phase 7 --- Command Centre

Build KPIs, filters, sorting, pagination and student table.

### Phase 8 --- Student Intelligence

Build student profile, subject attendance and historical presence.

### Phase 9 --- Polish

Add loading states, error states, empty states, duplicate detection,
audit information and responsive UI.

------------------------------------------------------------------------

# 35. Definition of Done

The first production-quality version should satisfy the following story
completely:

A user can upload a real attendance `.xls` or `.xlsx` file. The
application can read the workbook and detect its relevant metadata and
student attendance structure. The user can review and correct the
detected institute, program, branch, division, semester, academic year
and attendance period. After confirmation, the system stores the
original file and creates a historical upload snapshot. Every student is
resolved primarily through Enrollment Number. Attendance data is
normalized and stored without destroying previous uploads. When another
comparable sheet is uploaded, the system compares student identities
against the previous snapshot and identifies new and missing students
without deleting historical student records. The Information module
displays the cleaned dataset context. The Command Centre provides
multi-dimensional filters and a searchable student table. The Student
Intelligence module shows a student's current attendance, subject-wise
data, historical attendance records, dataset presence and last date on
which their data was received.

The final product should feel like a system that understands attendance
datasets over time, not a website that merely displays Excel
spreadsheets.

------------------------------------------------------------------------

# 36. Engineering Principle

Build the portal around this simple model:

**Excel is the source.**

**Storage preserves the original source.**

**The database is the structured memory.**

**Uploads are historical snapshots.**

**Students are persistent identities.**

**Attendance records belong to snapshots.**

**Comparison creates intelligence.**

**Next.js is the application layer that brings all of this together.**

The most important objective is reliability of historical data. A new
spreadsheet should add information to the system, not destroy the
information that was already there.
