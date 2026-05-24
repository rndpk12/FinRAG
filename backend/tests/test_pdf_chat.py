from rag_pipeline import ask_finrag

query = "What risks did Tesla mention in the report?"

answer = ask_finrag(query)

print("\nQUESTION:\n")
print(query)

print("\nANSWER:\n")
print(answer)