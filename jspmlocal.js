// Copyright 2016 Net at Work GmbH
// 
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
// 
//     http://www.apache.org/licenses/LICENSE-2.0
// 
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var Promise = require('rsvp').Promise;
var asp = require('rsvp').denodeify;
var fs = require('graceful-fs');
var path = require('path');
var console = require('console');

function clone(a) {
	var b = {};
	for (var p in a) {
		if (a[p] instanceof Array)
			b[p] = [].concat(a[p]);
		else if (typeof a[p] == 'object')
			b[p] = clone(a[p]);
		else
			b[p] = a[p];
	}
	return b;
}

var LocalLocation = function (options, ui) {
	this.ui = ui;
	this.name = options.name;

	this.registryURL = function (scope) {
		return scope || '';
	};

	this.tmpDir = options.tmpDir;
	this.remote = options.remote;

};

function getPackageObject(repo) {
	var packageFile = path.resolve('..', repo + '/package.json');

	return asp(fs.readFile)(packageFile)
		.then(function(lookupJSON) {
			return JSON.parse(lookupJSON.toString());
		})
		.catch(function(e) {
			if (e.code == 'ENOENT' || e instanceof SyntaxError)
				return { notfound: true };
			throw e;
		});
}

function copyFiles(src, dest, ui) {
	return asp(fs.access)(dest, fs.F_OK)
		.catch(function() {
			fs.mkdirSync(dest);
		})
		.then(function() {
			return asp(fs.readdir)(src);
		})
		.then(function (filePaths) {
			var tasks = filePaths.filter(function (fileName) { 
				return fileName.indexOf("jspm_packages") <= -1
					&& fileName.indexOf("node_modules") <= -1;
				})
				.map(function (fileName) {
					var filePath = path.resolve(src, fileName);
					var outFilePath = path.resolve(dest, fileName);
					var isDirectory = fs.lstatSync(filePath).isDirectory();
					
					if (isDirectory) {
						return copyFiles(filePath, outFilePath, ui);
					} else {
						return asp(fs.readFile)(filePath)
							.then(function(fileContent) {
								fs.writeFileSync(outFilePath, fileContent);
								return Promise.resolve();
							});
					}
				});
			return Promise.all(tasks);
		});
}

LocalLocation.packageFormat = /^@[^\/]+\/[^\/]+|^[^@\/][^\/]+/;

LocalLocation.prototype = {
	lookup: function (repo) {
		return getPackageObject(repo)
			.then(function (packageObject) {
				var result = { versions: { } };
				result.versions[packageObject.version] = { hash: 'abcdefg', stable:true, meta: {} };
				return result;
			});
	},
	
	download: function(repo, version, hash, versionData, outDir) {
		var packageDist = path.resolve('..', repo);
		var myUi = this.ui;
		return getPackageObject(repo)
			.then(function (pjson) {
				return copyFiles(packageDist, outDir,myUi)
					.then(function () {
					return clone(pjson);
				})
			});
	}
};

module.exports = LocalLocation;
