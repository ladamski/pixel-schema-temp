## TEST IGNORE
# Pixels Schema and Validation

This repository holds the JSON schema and code for validating pixel definitions defined by each of DuckDuckGo's products.

We uses pixels to improve our product and to understand how it is being used. 
Except for cases where users purposefully share sensitive or identifying information with us, such as,
in a breakage report, DuckDuckGo pixels are anonymous.
To learn more about our pixels, visit: https://duckduckgo.com/duckduckgo-help-pages/privacy/atb/

Note: The effort to define our pixels is on-going. Not all our product repositories will contain pixel definitions.

## Setup
A repository that supports pixel definitions will have a folder setup with roughly the following structure:
```
RepoSpecificPixelFolder
    --> pixels [directory that can contain sub-directories with various .json files]
        --> feature1 [directory for pixels related to 'feature1']
            --> interaction_pixels.json
            --> crash_pixels.json
            --> ...
        --> other_pixels.json [file for any pixels that do not belong to a feature folder]
        --> ...
    --> common_params.json [file that defines commonly used parameters]
    --> common_suffixes.json [file that defines commonly used suffixes]
```

You can organize the files and sub-directories within `pixels` however you like, the example above is just one option.

## Validation
**Background**:
* Validation ensures that pixel definitions conform to the [schema](./schemas/pixel_schema.json5) and follow a consistent format.
* Validation will run as part of CI, but you can also run it manually - details below.
* A repository that supports pixel definitions will have a folder setup with `package.json` pointing to this module, referred to as `PackageFolder` below. 
    * Note: usually `PackageFolder` is the same as the `RepoSpecificPixelFolder` referenced in the previous section.

**Pre-requisites**:
* Install Node.js: see instructions in https://nodejs.org/en/download
* Install dependencies:
    ```
    $ cd ${PackageFolder}
    $ npm i
    ```

**Running validation**:
```
$ cd ${PackageFolder}
$ npm run validate-defs
```
Note:
* If formatting errors are found, you can fix them with `npm run lint.fix`
* For schema validation failures, check the output and apply fixes manually
* You can also (re)validate a single file: 
    * Schema validation: `npx validate-ddg-pixel-defs . -f ${path to file relative to PackageFolder/pixels/ directory}`
    * Formatting: `npx prettier ${path to file relative to PackageFolder/ directory} --check`

## Documenting a pixel
Each JSON file can contain multiple pixels, keyed by the static portion of the pixel name. 
Add your pixel where it makes the most sense.

You can use either JSON or JSON5 (JSON with comments, trailing commas) to document your pixels.
All pixel definitions must adhere to the [pixel schemas](./schemas/pixel_schema.json5). 

Below, you'll find a walkthrough of the schema requirements and options.
As you read through, you can refer to the [pixel_guide.json](./tests/test_data/valid/pixels/pixel_guide.json5) for examples.

### Minimum requirements
Each pixel **must** contain the following properties:
* `description` - when the pixel fires and its purpose
* `owners` - DDG usernames of who to contact about the pixel
* `triggers` - one or more of the [possible triggers](./schemas/pixel_schema.json5#27) that apply to the pixel

### Pixels with dynamic names
If the pixel name is parameterized, you can utilize the `suffixes` property.

Required properties for each suffix:
* `description`

Optional properties for each suffix:
* `key` - static portion of the suffix
* JSON schema types - used to indicate constrained values for the suffix. Can be anything from https://json-schema.org/understanding-json-schema/reference/type

### Pixels with parameters
If the pixel contains parameters, you can utilize the `parameters` property.

Required properties for each parameter:
* `key` - parameter key
  * As an alternative, you can use `keyPattern` to define dynamic parameter keys.
  Note that such cases are unusual and should be avoided if possible.
* `description`

Optional properties for each parameter:
* JSON schema types - used to indicate constrained parameter values. Can be anything from https://json-schema.org/understanding-json-schema/reference/type

### Temporary pixels
If the pixel is temporary, set an expiration date in the `expires` property.

## License
DuckDuckGo Pixels Schema is distributed under the [Apache 2.0 License](LICENSE).

## Questions
* **How can I contribute to this repository?** We are not accepting external pull requests at this time.
Security bugs can be submitted through our [bounty program](https://hackerone.com/duckduckgo/reports/new?type=team&report_type=vulnerability) or by sending an email to security@duckduckgo.
