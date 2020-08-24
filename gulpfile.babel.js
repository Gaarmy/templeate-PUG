//Gulp Dependencies
import gulp from 'gulp'
import concat from 'gulp-concat'
import cacheBust from 'gulp-cache-bust'
import plumber from 'gulp-plumber'
import del from 'del'
import rename from 'gulp-rename'
import log from 'fancy-log'
//JavaScript
import babel from 'gulp-babel'
import terser from 'gulp-terser'
import source from 'vinyl-source-stream'
import buffer from 'vinyl-buffer'
import browserify from 'browserify'
import glob from 'glob'
import es from 'event-stream'
import babelify from 'babelify'
//HTML
import htmlmin from 'gulp-htmlmin'
//PUG
import pug from 'gulp-pug'
//CSS
import postcss from 'gulp-postcss'
import cssnano from 'cssnano'
import autoprefixer from 'autoprefixer'
import clean from 'gulp-purgecss'
//SASS
import sass from 'gulp-sass'
//Optimización de imágenes
import imagemin from 'gulp-imagemin'
//Broser sync
import browserSync, { init as server, stream, reload } from 'browser-sync'

var production = false

//Variables/constantes
const cssPlugins = [
    cssnano(),
    autoprefixer()
];

gulp.task('html-min', () => {
    return gulp
        .src('./src/*.html')
        .pipe(plumber())
        .pipe(htmlmin({
            collapseWhitespace: true,
            removeComments: true
        }))
        .pipe(cacheBust({
            type: 'timestamp'
        }))
        .pipe(gulp.dest('./public'))
})

gulp.task('styles', () => {
    return gulp
        .src('./src/css/**/*.css')
        .pipe(plumber())
        .pipe(concat('vendor-min.css'))
        .pipe(postcss(cssPlugins))
        .pipe(gulp.dest('./public/css/vendor'))
        .pipe(stream())
})
gulp.task('jsModule', function (done) {
    // glob('./src/js/main-**.js', function (err, files) {
    glob('./src/js/*.js', function (err, files) {
        if (err) done(err);
        var tasks = files.map(function (entry) {
            log('started building ' + entry);
            return browserify({ entries: [entry] })
                .transform(babelify)
                .bundle()
                .pipe(source(entry))
                .pipe(buffer())
                .pipe(terser())
                .pipe(rename({
                    dirname: "js",
                    extname: '.min.js'
                }))
                .pipe(gulp.dest('./public'));
        });
        es.merge(tasks).on('end', done);
    })
});
gulp.task('babel', () => {
    return gulp
        .src('./src/js/**/*.js')
        .pipe(plumber())
        // .pipe(concat('scripts-min.js'))
        .pipe(babel())
        .pipe(terser())
        .pipe(gulp.dest('./public/js'))
})
gulp.task('babelVendor', () => {
    return gulp
        .src('./src/js/vendor/*.js')
        .pipe(plumber())
        .pipe(concat('vendor-min.js'))
        .pipe(babel())
        .pipe(terser())
        .pipe(gulp.dest('./public/js/vendor'))
})

gulp.task('views', () => {
    return gulp
        .src('./src/views/pages/*.pug')
        .pipe(plumber())
        .pipe(pug({
            pretty: production ? false : true
        }))
        .pipe(cacheBust({
            type: 'timestamp'
        }))
        .pipe(gulp.dest('./public'))
})

gulp.task('sass', () => {
    return gulp.src('./src/scss/styles.scss')
        .pipe(plumber())
        .pipe(sass({
            outputStyle: 'compressed'
        }))
        .pipe(postcss(cssPlugins))
        .pipe(gulp.dest('./public/css'))
        .pipe(browserSync.stream())
})

gulp.task('clean', () => {
    return gulp.src('./public/css/*.css')
        .pipe(plumber())
        .pipe(clean({
            content: ['./public/*.html']
        }))
        .pipe(gulp.dest('./public/css'))
})

gulp.task('imgmin', () => {
    return gulp.src('./src/assets/img/**/*')
        .pipe(plumber())
        .pipe(imagemin([
            imagemin.gifsicle({ interlaced: true }),
            imagemin.mozjpeg({ quality: 50, progressive: true }),
            imagemin.optipng({ optimizationLevel: 1 }),
            imagemin.svgo({
                plugins: [
                    { removeViewBox: true },
                    { cleanupIDs: false }
                ]
            })
        ]))
        .pipe(gulp.dest('./public/assets/img'))
})

gulp.task('font', () => {
    return gulp.src('./src/assets/fonts/*')
        .pipe(gulp.dest('./public/assets/fonts'))
})
gulp.task('video', () => {
    return gulp.src('./src/assets/video/*')
        .pipe(gulp.dest('./public/assets/video'))
})
gulp.task('broch', () => {
    return gulp.src('./src/assets/brochure/*')
        .pipe(gulp.dest('./public/assets/brochure'))
})

gulp.task('reset', function () {
    return del('public');
})

gulp.task('default', () => {
    server({
        server: './public'
    })

    // gulp.watch('./src/*.html', gulp.series('html-min')).on('change', reload)
    gulp.watch('./src/css/*.css', gulp.series('styles'))
    gulp.watch('./src/views/**/*.pug', gulp.series('views')).on('change', reload)
    gulp.watch('./src/scss/**/*.scss', gulp.series('sass'))
    gulp.watch('./src/js/**/*.js', gulp.series('jsModule')).on('change',reload)
    // gulp.watch('./src/js/*.js', gulp.series('babel')).on('change', reload)
    gulp.watch('./src/js/vendor/*.js', gulp.series('babelVendor')).on('change', reload)
})
gulp.task('cambia', (done)=>{
    production = true
    log(production)
    done();
})
/* gulp.task('build', gulp.series('cambia','reset', 'styles', 'sass', 'views', 'jsModule', 'babelVendor', 'font', 'imgmin', 'video', 'clean'))*/
gulp.task('build', gulp.series('cambia','reset', 'styles', 'sass', 'views', 'jsModule', 'babelVendor', 'font', 'imgmin', 'video', 'broch'))

gulp.task('init', gulp.series('reset', 'styles', 'sass', 'views', 'jsModule', 'babelVendor', 'font', 'video', 'imgmin'))