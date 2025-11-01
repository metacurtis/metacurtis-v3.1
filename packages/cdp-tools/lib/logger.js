import chalk from 'chalk';

export class Logger {
  info(message) {
    console.log(chalk.blue(message));
  }

  success(message) {
    console.log(chalk.green(message));
  }

  error(message) {
    console.error(chalk.red(message));
  }

  warn(message) {
    console.warn(chalk.yellow(message));
  }

  debug(message) {
    console.log(chalk.gray(message));
  }
}
