var verbose = 1;

function log(str) {
  if (verbose) {
    console.log('*********');
    for (var s in str) {
      console.log(str[s]);
    }
    console.log('*********');
  }
}
