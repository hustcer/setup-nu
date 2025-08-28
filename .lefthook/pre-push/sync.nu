loop {
  let input = input -s | split row " "
  if ($input | length) < 4 {continue};
  print 'Pushing to remote...'
  print $input.0?
  print $input.1?
  print $input.2?
  print $input.3?
  print '----------------------------------'
  break
}