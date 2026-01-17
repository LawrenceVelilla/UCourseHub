# UCourseHub

UCourseHub is a web application that allows users to search for courses which shows information like:
  - Course Name
  - Course Description (Prereqs, Coreqs, Dependents)
  - Course Professor
  - Course Professor Rating
  - Course Professor Difficulty
  - Course Professor Would Take Again Percentage
  - Course Professor Number of Ratings

### Setup and Installation

1. Clone the repository
2. Install dependencies
3. Set up environment variables
4. Run the application
Server should be running on port 3000


### API Endpoints

`POST /rmp/admin`

This endpoint is used to scrape professors from RateMyProfessor. It mimics the query used by RateMyProfessor to search for professors for a school.

Query Parameters:
  `schoolId`: The ID of the school to scrape professors from
  `department`: The department to scrape professors from
  `departmentId`: The ID of the department to scrape professors from
  `save`: Whether to save the professors to the database