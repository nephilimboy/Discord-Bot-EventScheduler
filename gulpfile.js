let gulp = require('gulp');
let exec = require('child_process').exec;

gulp.task("default", tsc);

gulp.task("compile", tsc);

gulp.task("build", ["compile"], function() {
  gulp.src('./src/config/**/*.ts')
  .pipe(gulp.dest('./build/config'));
  gulp.src('./src/resources/**/*.json')
  .pipe(gulp.dest('./build/resources'));
  return;
});

gulp.task("watch", ["build"], function() {
  let watcher = gulp.watch("./src/**/*", ["build"]);
  watcher.on("change", function(event) {
    console.log(`${event.path}: ${event.type}, rerunning tasks...`);
  });
});

function tsc(done) {
  exec('tsc', function(err, stdout, stderr) {
    console.log(stdout);
    if (err) done(err);
    else done();
  });
}