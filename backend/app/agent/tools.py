TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "create_study_plan",
            "description": (
                "Create a structured study schedule for the student. "
                "Generates a day-by-day plan with sessions for each subject."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "subjects": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of subjects to study (e.g. ['Mathematics', 'Physics'])",
                    },
                    "total_days": {
                        "type": "integer",
                        "description": "Total number of days for the study plan",
                        "minimum": 1,
                        "maximum": 365,
                    },
                    "hours_per_day": {
                        "type": "number",
                        "description": "Number of study hours per day",
                        "minimum": 0.5,
                        "maximum": 16,
                    },
                    "start_date": {
                        "type": "string",
                        "description": "Start date for the plan in YYYY-MM-DD format",
                    },
                    "notes": {
                        "type": "string",
                        "description": "Optional additional notes or constraints for the plan",
                    },
                },
                "required": ["subjects", "total_days", "hours_per_day", "start_date"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "generate_quiz",
            "description": (
                "Generate multiple-choice quiz questions on a given subject and topic. "
                "Each question has 4 options (A, B, C, D) with one correct answer."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "subject": {
                        "type": "string",
                        "description": "The academic subject (e.g. 'Mathematics', 'Physics')",
                    },
                    "topic": {
                        "type": "string",
                        "description": "The specific topic within the subject (e.g. 'Calculus', 'Thermodynamics')",
                    },
                    "difficulty": {
                        "type": "string",
                        "enum": ["beginner", "intermediate", "advanced"],
                        "description": "Difficulty level of the quiz",
                    },
                    "num_questions": {
                        "type": "integer",
                        "description": "Number of questions to generate (1-20)",
                        "minimum": 1,
                        "maximum": 20,
                    },
                },
                "required": ["subject", "topic", "difficulty", "num_questions"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Add a new task or to-do item for the student.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string",
                        "description": "Title or name of the task",
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional detailed description of the task",
                    },
                    "deadline": {
                        "type": "string",
                        "description": "Optional deadline in YYYY-MM-DD format",
                    },
                },
                "required": ["title"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_tasks",
            "description": "Return the student's pending and overdue tasks.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "list_study_plans",
            "description": "Return all of the student's active study plans.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": [],
            },
        },
    },
]
