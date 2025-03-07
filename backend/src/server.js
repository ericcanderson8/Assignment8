/*
#######################################################################
#
# Copyright (C) 2020-2025 David C. Harrison. All right reserved.
#
# You may not use, distribute, publish, or modify this code without
# the express written permission of the copyright holder.
#
#######################################################################
*/
/*
#######################################################################
#######               DO NOT MODIFY THIS FILE               ###########
#######################################################################
*/

import 'dotenv/config';
import app from './app.js';

app.listen(3010, () => {
  console.log('CSE186 Assignment 8 Backend Running');
  console.log('API Testing UI is at: http://localhost:3010/api/v0/docs/');
});
