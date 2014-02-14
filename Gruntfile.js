module.exports = function (grunt) {

    grunt.initConfig ({

        sass: {
            dist: {
                src: 'sass/main.sass',
                dest: 'public/main.css'
            }
        },

        watch: {
            files: ['sass/*.sass'],
            tasks: ['sass']
        }

    });

    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['sass', 'watch']);

};