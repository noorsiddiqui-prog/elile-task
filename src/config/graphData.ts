import type { GraphData } from "../types";

export const graphData: GraphData = {
  nodes: [
    { id: "email:ahmed@gmail.com",       type: "email",    label: "ahmed@gmail.com" },
    { id: "phone:+971501234567",          type: "phone",    label: "+971 50 123 4567" },
    { id: "username:ahmed_uae",           type: "username", label: "ahmed_uae" },
    { id: "email:a.hassan@outlook.com",   type: "email",    label: "a.hassan@outlook.com" },
    { id: "username:hassan_99",           type: "username", label: "hassan_99" },
    { id: "phone:+971509876543",          type: "phone",    label: "+971 50 987 6543" },
  ],
  edges: [
    { source: "email:ahmed@gmail.com",      target: "phone:+971501234567",        confidence: 0.95 },
    { source: "email:ahmed@gmail.com",      target: "username:ahmed_uae",         confidence: 0.88 },
    { source: "phone:+971501234567",        target: "email:a.hassan@outlook.com", confidence: 0.72 },
    { source: "email:a.hassan@outlook.com", target: "username:hassan_99",         confidence: 0.91 },
    { source: "username:hassan_99",         target: "phone:+971509876543",        confidence: 0.65 },
  ],
};
