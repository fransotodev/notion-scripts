# Notion API

A collection of different scripts I have made for my own Notion Workspace.
Create a .env file with you tokens for authentication and Databases_ids

## deleteAllRecords

**🚨WARNING🚨**

Delete \* from table **without a WHERE clause**

## mergeAndInsert

This is for a particular case of mine. I had a database with multiple records for a same property `name: Date , type: date`.

Created this script to merge in a single database record all the records for the same date.

Constraints: The properties where not overlapping (given a property, for a given date there was no more than 1 record with value for that property).
