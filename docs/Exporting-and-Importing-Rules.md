# Exporting & Importing Rules
This section deals with the case when you need to store the rules to an external Database or you need to load the rules stored inside an external Database.

#### R.export()

exports the current rules. If the rules have been dynamically set then the exports reflects the last state before export is called. Due to fact that functions cannot be stringified, we have to change functions into into another format before committing them to the string.

Inactive rules are also exported.

#### R.import()

imports the rules that have been exported using the export function. If the rules have been dynamically set then the exports reflects the last state before export is called.

