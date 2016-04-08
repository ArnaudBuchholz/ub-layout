"use strict";
/*eslint-env node*/

module.exports = function (grunt) {

    require("time-grunt")(grunt);

    // Allows access to package definition from everywhere
    global.pkg = grunt.file.readJSON("./package.json");

    require("load-grunt-config")(grunt);
    grunt.task.loadTasks("grunt/tasks");

};
