jspm-local
===
[![NPM version][npm-image]][npm-url] 

## Installation

Install `jspm-local` using npm into your global or local repository.

```
npm install -g jspm-local
# or locally
npm install jspm-local --save-dev
```

Register a new endpoint for jspm.
```
jspm registry create local jspm-local
``` 

## Usage

Install `<YourProject>` as a local dependecy.

```
jspm install local:<YourProject>
```
Jspm-local will search for a folder named `<YourProject>` next to current folder. This is eqal to `../<YourProject>/package.json` 

## License

[Apache 2.0](/license.txt)

[npm-url]: https://npmjs.org/package/jspm-local
[npm-image]: http://img.shields.io/npm/v/jspm-local.svg