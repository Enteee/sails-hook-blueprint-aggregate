# sails-hook-blueprint-aggregate
_Adds blueprint api method to aggregate records in database._

This is useful for example in pagination when you need to calculate number of pages. 

## Installation

In Sails.js v0.11+ installed hooks are run automatically. Therefore, simply install the hook via `npm`:

    npm install sails-hook-blueprint-aggregate

## Usage

### Aggregation

```
GET /:model/aggregate?where={:CRITERIA}&groupBy=:Attribute&sum=:Attribute&average=:Attribute&min=:Attribute&max=:Attribute&sort=:Attribute
```

#### Examples

| Query | Response |
| ----- | -------- |
|`Model/aggregate?groupBy=valid` | `[ { "valid": false }, { "valid": true } ]` |
|`Model/aggregate?groupBy=valid&sum=test` | `[ { "valid": false, "test": 720 }, { "valid": true, "test": 199 } ]` |
|`Model/aggregate?groupBy=valid&average=test` | ` { "valid": false, "test": 45 }, { "valid": true, "test": 66.3333333333333 }`|
|`Model/aggregate?min=test` | ` [ { "test": 2 } ] ` |

### Count

```
GET /:model/count?where={:CRITERIA}&groupBy=:Attribute
```

#### Examples

| Query | Response |
| ----- | -------- |
|`Model/count` | `[ { "count": 4 } ]` |
|`Model/aggregate?groupBy=valid` | `[ { "false": 3, "true": 1 } ]` |
|`Model/count?groupBy=["valid","test"]` | `[ { "false,24": 2, "true,31": 1, "false,87": 1 } ]` |

## ToDo

- [ ] Make :model/count use Model.count, currently this is not possible as Model.count is prone to SQL-injections

## Acknowledgement

This module is based on:
* [sails-hook-blueprint-count](https://github.com/kristian-ackar/sails-hook-blueprint-count)
* [sails-hook-blueprint-sum](https://github.com/GregKapustin/sails-hook-blueprint-sum)

thank you!

[ref]:https://github.com/balderdashy/waterline/issues/61

