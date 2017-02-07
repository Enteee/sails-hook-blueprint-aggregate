# sails-hook-blueprint-count
_Adds blueprint api method to aggregate records in database._

This is useful for example in pagination when you need to calculate number of pages. 

## Installation

In Sails.js v0.11+ installed hooks are run automatically. Therefore, simply install the hook via `npm`:

    npm install sails-hook-blueprint-aggregate

## Usage

### Count

    GET /:model/count?where={:CRITERIA}

"where" parameter is optional. If it's used it's used in the same way like you use it in default blueprint api find method
[Sails.js blueprint api find method documentation](http://sailsjs.org/documentation/reference/blueprint-api/find-where).

## ToDo

- [X] Integrate [sails-hook-blueprint-sum](https://github.com/GregKapustin/sails-hook-blueprint-sum)
- [ ] Fix [Policies not applied](https://github.com/kristian-ackar/sails-hook-blueprint-count/issues/4)
- [ ] Integrate group by ([ref])
- [ ] Integrate AVG ([ref])
- [ ] Integrate MAX ([ref])
- [ ] Integrate MIN ([ref])
- [ ] Integrate HAVING ([ref])
- [ ] Integrate LEN ([ref])
- [ ] Integrate MEDIAN ([ref])

## Acknowledgement

This module is based on:
* [sails-hook-blueprint-count](https://github.com/kristian-ackar/sails-hook-blueprint-count)
* [sails-hook-blueprint-sum](https://github.com/GregKapustin/sails-hook-blueprint-sum)

thank you!

[ref]:https://github.com/balderdashy/waterline/issues/61

