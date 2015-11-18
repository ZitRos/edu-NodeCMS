import gulp from "gulp";
import scss from "gulp-sass";
import clean from "gulp-clean";

gulp.task("clean", () => {
    return gulp.src("./src/static/css/", {read: false})
        .pipe(clean());
});

gulp.task("build-scss", ["clean"], () => {
    gulp.src("./src/static/scss/*.scss")
        .pipe(scss().on("error", scss.logError))
        .pipe(gulp.dest("./src/static/css"));
});

gulp.task("watch", () => {
    gulp.watch("./src/static/scss/**/*.scss", ["default"]);
});

gulp.task("default", ["build-scss"]);