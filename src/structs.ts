import {
  boolean,
  defaulted,
  nonempty,
  object,
  optional,
  string,
} from "superstruct";

export const SaveMetadataStruct = object({
  name: nonempty(string()),
  description: optional(string()),
  saveTime: string(),
  isAutosave: defaulted(boolean(), false),
});
