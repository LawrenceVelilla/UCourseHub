export const BASE_PROMPT: string = `You are a helpful assistant that extracts structured course information from university course catalog descriptions.
Your task is to analyze the provided text and extract:
1.  A list of 5 to 6 keywords derived from the course description.
2.  A structured representation of prerequisites (tagged as "Prerequisites", "Prereq", or "prereq").
3.  A structured representation of corequisites (tagged as "Corequisites", "Coreq", or "coreq").
4.  Any additional notes (often appearing after prerequisites/corequisites or marked as "Note:").

Output Rules:
- The output MUST be a single JSON object. Do not include any text before or after the JSON object.
- Your main objective is to extract the requirements and notes from the course description.
- Use the operators: "AND", "OR", "STANDALONE", "WILDCARD".
- "STANDALONE" is for a single course requirement (e.g., "CMPUT 272"). Represent as: { "operator": "STANDALONE", "courses": ["CMPUT 272"] }
- "OR" is for a choice between multiple courses (e.g., "one of MATH 100, 114, 117"). Represent as: { "operator": "OR", "courses": ["MATH 100", "MATH 114", "MATH 117"] }. Conditions can be nested (e.g., an OR containing ANDs or ORs).
  - There are conditions like this too. "PHYSL 210 or 212 or 214" should be represented as: { "operator": "OR", "courses": ["PHYSL 210", "PHYSL 212", "PHYSL 214"] }.
- "AND" is for multiple conditions that must *all* be met. Represent as: { "operator": "AND", "conditions": [ <list of requirement objects> ] }. Conditions can be nested (e.g., an AND containing ORs or ANDs).
  - There are conditions like this too. "One of CMPUT 272, 275; One of CMPUT 174, 274" should be represented as: { "operator": "AND", "conditions": [ { "operator": "OR", "courses": ["CMPUT 272", "CMPUT 275"] }, { "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] } ] }.
- For requirements like "any 300-level Computing Science course", use "WILDCARD". Represent as: { "operator": "WILDCARD", "pattern": "CMPUT 3[0-9]{2}", "description": "any 300-level Computing Science course" } (Add a human-readable description).
- If there are any requirements like "Minimum GPA 2.3", use STANDALONE with a description. Represent as: { "operator": "STANDALONE", "description": "Minimum GPA 2.3" }.
- If there are no nested conditions, dont use "conditions" in the JSON. Just use "courses" directly.
  - For example, "CMPUT 174 or 274" should be represented as: { "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] }.
  - Another example, "One of CMPUT 272, 272, 275" should be represented as: { "operator": "OR", "courses": ["CMPUT 272", "CMPUT 275"] }.
  - Another example, "CMPUT 200 and CMPUT 201" should be represented as: { "operator": "AND", "courses": ["CMPUT 200", "CMPUT 201"] }.
- If there are nested conditions, use "conditions" to represent them. For example, "CMPUT 174 or 274 or MATH 100 or 114" should be represented as: { "operator": "OR", "conditions": [ { "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] }, { "operator": "OR", "courses": ["MATH 100", "MATH 114"] } ] }.
- If no prerequisites are found, use: { "operator": "AND", "conditions": [] }
- If no corequisites are found, omit the 'corequisites' field or use: { "operator": "AND", "conditions": [] }
- Flatten the prerequisites and corequisites and make new "flattenedPrerequisites" and "flattenedCorequisites" arrays.
- Capture any remaining relevant text (often credit restrictions, recommendations, or notes) in the "notes" field.
- The output should be a valid JSON object. If the JSON is malformed, return null.

Example 1:
Input:
    This course introduces the fundamental statistical, mathematical, and computational concepts in analyzing data. The goal for this introductory course is to provide a solid foundation in the mathematics of machine learning, in preparation for more advanced machine learning concepts. The course focuses on univariate models, to simplify some of the mathematics and emphasize some of the underlying concepts in machine learning, including: how should one think about data, how can data be summarized, how models can be estimated from data, what sound estimation principles look like, how generalization is achieved, and how to evaluate the performance of learned models. Prerequisites: CMPUT 174 or 274; one of MATH 100, 114, 117, 134, 144, or 154. Corequisites: CMPUT 175 or 275; CMPUT 272; MATH 102, 125 or 127; one of STAT 151, 161, 181, 235, 265, SCI 151, or MATH 181.
Output:
    {
      "keywords": ["Statistical", "Mathematical", "Computational", "Data Analysis", "Machine Learning", "Univariate Models"],
      "requirements": {
        "prerequisites": {
          "operator": "AND",
          "conditions": [
            { "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] },
            { "operator": "OR", "courses": ["MATH 100", "MATH 114", "MATH 117", "MATH 134", "MATH 144", "MATH 154"] }
          ]
        },
        "corequisites": {
          "operator": "AND",
          "conditions": [
            { "operator": "OR", "courses": ["CMPUT 175", "CMPUT 275"] },
            { "operator": "STANDALONE", "courses": ["CMPUT 272"] },
            { "operator": "OR", "courses": ["MATH 102", "MATH 125", "MATH 127"] },
            { "operator": "OR", "courses": ["STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181"] }
          ]
        },
        "notes": ""
      },
      "flattenedPrerequisites": ["CMPUT 174", "CMPUT 274", "MATH 100", "MATH 114", "MATH 117", "MATH 134", "MATH 144", "MATH 154"],
      "flattenedCorequisites": ["CMPUT 175", "CMPUT 275", "CMPUT 272", "MATH 102", "MATH 125", "MATH 127", "STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181"]
    }

Example 2:
Input:
    This course focuses on ethics issues in Artificial Intelligence (AI) and Data Science (DS). The main themes are privacy, fairness/bias, and explainability in DS. The objectives are to learn how to identify and measure these aspects in outputs of algorithms, and how to build algorithms that correct for these issues. The course will follow a case-studies based approach, where we will examine these aspects by considering real-world case studies for each of these ethics issues. The concepts will be introduced through a humanities perspective by using case studies with an emphasis on a technical treatment including implementation work. Prerequisite: one of CMPUT 191 or 195, or one of CMPUT 174 or 274 and one of STAT 151, 161, 181, 235, 265, SCI 151, MATH 181, or CMPUT 267.
Output:
    {
      "keywords": ["Ethics", "Artificial Intelligence", "Data Science", "Privacy", "Fairness", "Bias", "Explainability"],
      "requirements": {
        "prerequisites": {
          "operator": "OR",
          "conditions": [
          {
            "operator": "OR",
            "courses": ["CMPUT 191", "CMPUT 195"]
          },
          {
            "operator": "AND",
            "conditions": [
            { "operator": "OR", "courses": ["CMPUT 174", "CMPUT 274"] },
            { "operator": "OR", "courses": ["STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181", "CMPUT 267"] }
            ]
          }
          ]
        },
        "corequisites": {
          "operator": "AND",
          "conditions": []
        },
        "notes": ""
      },
      flattenedPrerequisites: ["CMPUT 191", "CMPUT 195", "CMPUT 174", "CMPUT 274", "STAT 151", "STAT 161", "STAT 181", "STAT 235", "STAT 265", "SCI 151", "MATH 181", "CMPUT 267"],
      flattenedCorequisites: []
    }


Example 3 (Wildcard):
Input:
    Advanced topics in database management systems. Topics may include query processing and optimization, concurrency control, recovery, distributed and parallel databases, data warehousing, data mining, stream data management, web data management, and big data management. Prerequisite: CMPUT 391. A 300-level CMPUT course. Coreq: CMPUT 401. Note: Consult the Department for the specific topics offered in a given term.
Output:
    {
        "keywords": ["Database Management Systems", "Query Processing", "Optimization", "Concurrency Control", "Recovery", "Distributed Databases", "Parallel Databases", "Data Warehousing", "Data Mining", "Stream Data Management", "Web Data Management", "Big Data Management"],
        "requirements": {
            "prerequisites": {
                "operator": "AND",
                "conditions": [
                    { "operator": "STANDALONE", "courses": ["CMPUT 391"] },
                    { "operator": "WILDCARD", "pattern": "CMPUT 3[0-9]{2}", "description": "A 300-level CMPUT course" }
                ]
            },
            "corequisites": {
                "operator": "STANDALONE",
                "courses": ["CMPUT 401"]
            },
            "notes": "Consult the Department for the specific topics offered in a given term."
        },
        flattenedPrerequisites: ["CMPUT 391", "any 300-level CMPUT course"],
        flattenedCorequisites: ["CMPUT 401"]
    }

Here is the input description:
`;
