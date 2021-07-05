const jsonSchema = {
  type: "object",
  properties: {
    id: { type: "integer" },
    name: { type: "string" },
  },
};

const urlEncodedSchema = {
  type: "object",
  properties: {
    id: { type: "string" },
    name: { type: "string" },
  },
};

export const CatSchema = {
  description: "Save Cat",
  required: true,
  content: {
    "application/json": { schema: jsonSchema },
    "application/x-www-form-urlencoded": { schema: urlEncodedSchema },
  },
};
