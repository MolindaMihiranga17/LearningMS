import assert from "node:assert/strict";
import { test } from "node:test";
import { z } from "zod";
import { loadModule } from "./load-module.mjs";

const { createClassSchema } = loadModule("lib/validation/class.schema.ts", { zod: { z } });

const validClass = {
  name: "Grade 10",
  section: "A",
  academicYear: "2026",
  classTeacherId: "",
  timetableDay: "monday",
  timetableStart: "09:00",
  timetableEnd: "10:00",
  timetableRoom: "Room 3",
};

test("class timetable requires a complete, forward-running time slot", () => {
  assert.equal(createClassSchema.safeParse(validClass).success, true);
  assert.equal(createClassSchema.safeParse({ ...validClass, timetableEnd: "08:30" }).success, false);
  assert.equal(createClassSchema.safeParse({ ...validClass, timetableEnd: "" }).success, false);
});
