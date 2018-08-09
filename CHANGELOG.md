# Changelog

This changelog is formatted based on [Keep a Changelog](http://keepachangelog.com/) and this project attempts to adhere to [Semantic Versioning](http://semver.org) as much as possible.

## v1.0.3 - 2018-05-24

### Fixed

- Fixed a deprecation issue with MongoDB v3.6, where the `$pushAll` operator used by Mongoose is no longer available. The Mongoose package has been updated to resolve this. ([`8c1d035`](https://github.com/pyrox18/schedulerbot/commit/8c1d03525dbd68d612a3202fae8e4040d5a165cf)) ([Sentry issue link](https://sentry.io/share/issue/354a8ba8275843f384742dd3778d6257/))
- Removed the `useMongoClient` option when initialising Mongoose, as it is no longer required with v5. ([`6a3a245`](https://github.com/pyrox18/schedulerbot/commit/6a3a245dbcd1079c2b6d65f225d80406e7116a2a))
- Updated dependencies. ([`22be158`](https://github.com/pyrox18/schedulerbot/commit/22be15849705efe202706783eb5241538d21b860))

## v1.0.2 - 2017-12-31

### Fixed

- Fixed a scoping issue with `this` which caused the event scheduler to not be called in intervals to check for events. ([`14bab46`](https://github.com/pyrox18/schedulerbot/commit/14bab46b4d3862ddba9b00353b6a0aeff4c3dfb4))

## v1.0.1 - 2017-12-30

### Fixed

- Replace the misused `setTimeout` function with `setInterval`. ([`2e77668`](https://github.com/pyrox18/schedulerbot/commit/2e776686ff729277bf8cfd0ebd66d3540d662201))

## v1.0.0 - 2017-12-30

### Added

- A `settings` command has been added, where a user can change the bot's prefix, default channel and timezone for their guild. ([`14de7cf`](https://github.com/pyrox18/schedulerbot/commit/14de7cf7358911a35f7d87e7fe4635c5de58685d))
- Permissions can now be assigned and viewed by mentioning a role or user directly. ([`e7e0ded`](https://github.com/pyrox18/schedulerbot/commit/e7e0dedb653018bab112149ef0371b312c3d411a))

### Changed

- Updated bot dependencies. ([`f1c6c6b`](https://github.com/pyrox18/schedulerbot/commit/f1c6c6bb23dfdf4f8c34371ef337d9ca9a83bb56))
- Performed a major refactoring exercise to make the source code cleaner and more modular. ([`6161191`](https://github.com/pyrox18/schedulerbot/commit/6161191e367a982f144534e07646c5d8afcf94e7))
  - **BREAKING CHANGE**: The bot token, MongoDB URI, Sentry DSN and Redis port variables are now loaded from an `.env` file.
  - **BREAKING CHANGE**: `bot.config.json` has been replaced with a `bot.config.ts` file to allow for external variable loading. With the changes made to the `.env` file, this config file now only stores the bot's default prefix, game data, and admin ID.
- Event embeds are now produced by a factory class. ([`d432fef`](https://github.com/pyrox18/schedulerbot/commit/d432fef9d3b8116ffa6a0dfc4344228ce5fb9138))
- Modified `help` commands to provide command examples. ([`ca83cf8`](https://github.com/pyrox18/schedulerbot/commit/ca83cf8dc05db4db7eb6ab11c2c3ade810cd2b99))
- The event scheduler now schedules events that will occur in 2 hours from whenever the scheduler checks for events. The scheduler will check for events every one hour. ([`5aab293`](https://github.com/pyrox18/schedulerbot/commit/5aab2934de1b74c11add85096cb9ed49c32df634))
- The `prefix` command can no longer be used to set the bot's prefix for a guild. The functionality is succeeded by the `settings` command. ([`6e3c515`](https://github.com/pyrox18/schedulerbot/commit/6e3c51528a918184dceb173c368a0f4c4ea4cca8))
- Added tslint for code linting. ([`f773d3a`](https://github.com/pyrox18/schedulerbot/commit/f773d3a95eed1f0ca535a25e4e72e9be2f70d24f))

### Fixed

- `perms show --user <user>` now correctly displays the "User" label in the result. ([`848856c`](https://github.com/pyrox18/schedulerbot/commit/848856c5725f620611ad15901d2788fd1fab73a1))

## v0.6.4 - 2017-11-16

### Fixed

- Corrected the checking for the number of flags passed in the `perms` and `perms show` commands. ([`24578e0`](https://github.com/pyrox18/schedulerbot/commit/24578e099e2a6b9d9580b4cdd40bc3c07ff70515))

## v0.6.3 - 2017-11-06

### Fixed

- Fixed the incorrect usage of redislock to lock calendars. ([#4](https://github.com/pyrox18/schedulerbot/issues/4), [`f3b43d2`](https://github.com/pyrox18/schedulerbot/commit/f3b43d2bf60818e798c888614baadc610676afa9))

## v0.6.2 - 2017-11-02

### Fixed

- Added a missing `await` keyword for calendar lock acquisition in the update event command handler. This reduces/eliminates the chance of users encountering a lock acquisition error. ([`be0cb2b`](https://github.com/pyrox18/schedulerbot/commit/be0cb2b325b60d5411de72c3dfbadbe7f349dee2))

## v0.6.1 - 2017-10-31

### Fixed

- Added a missing default channel assignment statement in the `init` command. ([`6012080`](https://github.com/pyrox18/schedulerbot/commit/60120805095747f86c2365881937547ab72dac90))

## v0.6.0 - 2017-10-26

### Added

- Events may now have descriptions attached to them via the `--desc` flag in the `event` and `event update` commands. e.g. `event Scrims 6p to 7p --desc Scrims on CS:GO` ([`69fb638`](https://github.com/pyrox18/schedulerbot/commit/69fb638a32d7963788d152b52ef79dbb9612ecd5))
- Events may now be repeated daily, weekly or monthly via the `--repeat` flag in the `event` and `event update` commands. e.g. `event Scrims 6p to 7p --repeat d` ([`005bb1c`](https://github.com/pyrox18/schedulerbot/commit/005bb1c8d30f33a42ada55e95088ace72e946d46))
- Sentry error tracking is now enabled for production environments.
- Added `eval` and `shell` admin commands. ([#3](https://github.com/pyrox18/schedulerbot/pull/3), [`480dea9`](https://github.com/pyrox18/schedulerbot/commit/480dea9e6e6c85cd43a39b8bb2e55b13ce1798d4))

### Changed

- The npm postinstall script now copies the example bot config file to a new file named `bot.config.json` instead of renaming the example itself. ([`c295c99`](https://github.com/pyrox18/schedulerbot/commit/c295c997378a8ce9d7c1a2aa5432bfa2e401da10))

### Fixed

- Event modification operations should no longer cause read/write conflicts with each other. This also applies to automated delete operations performed by the event scheduler class. ([#1](https://github.com/pyrox18/schedulerbot/issues/1), [#2](https://github.com/pyrox18/schedulerbot/pull/2), [`3416249`](https://github.com/pyrox18/schedulerbot/commit/34162499970e39a9981270ce18de9ecf4ebfbd05))

## v0.5.2 - 2017-10-13

### Changed

- The Eris library has been updated to v0.8.0, so TypeScript compilation now works without having to use any workarounds. ([`aaf80f5`](https://github.com/pyrox18/schedulerbot/commit/aaf80f5070e3e7892200f32c9518e0eb8226a94d))

### Fixed

- Entering an invalid timezone in the `init` command should now provide a proper response. ([`9b564b7`](https://github.com/pyrox18/schedulerbot/commit/9b564b77e8afaee89db58c43c71a6056d7239afc))

## v0.5.1 - 2017-10-06

### Fixed

- Fixed an issue where event notification jobs were not being unscheduled properly when updating or deleting events. ([`6ec58bf`](https://github.com/pyrox18/schedulerbot/commit/6ec58bf385db7b4c820513b578d16d569bfe8186))

## v0.5.0 - 2017-10-05

This release features a complete migration of the codebase to TypeScript, as well as a complete restructure of the bot's source code tree. As a result, this release breaks pretty much everything in the source code from the previous releases, but users should be able to use the same commands and functionality as before.

### Added

- All commands now have a default cooldown of 1 second. ([`9242a39`](https://github.com/pyrox18/schedulerbot/commit/9242a397d9e8cf711683b43bf89976933184420c))
- Common response strings are now stored in an independent resource file (`src/config/strings.resource.json`). ([`d0d76e5`](https://github.com/pyrox18/schedulerbot/commit/d0d76e58219f3d0925265c65f2797cc82ec17e9d))

### Changed

- Migrated the entire codebase to TypeScript.
- The `help` command and its subcommands now display rich embeds for the base help information and information for the `init`, `event`, `perms` and `prefix` commands. ([`e745d8d`](https://github.com/pyrox18/schedulerbot/commit/e745d8d763f87cccc9bfb75a9a28178f36712397))
- The `info` command now displays information in a rich embed. ([`0a9405d`](https://github.com/pyrox18/schedulerbot/commit/0a9405dd868657b74477f194873b1dfa44ab0c30))
- EventScheduler (previously Scheduler before the migration) now uses the ES6 Map data structure to store jobs. Map keys are now set to the actual ObjectID of the event document instead of the string equivalent. ([`cdf622c`](https://github.com/pyrox18/schedulerbot/commit/cdf622cf53cf363e754893b906bd835839f78a6c))

### Fixed

- Fixed a bug where event dates were being assigned timezones, but the dates themselves were not adjusted back to the values given by the user. ([`5946d22`](https://github.com/pyrox18/schedulerbot/commit/5946d225af459399c87aa776d61da35ae4e8e8ee))

### Removed

- Removed certain npm dependencies that are no longer used by the bot. ([`ecd91b5`](https://github.com/pyrox18/schedulerbot/commit/ecd91b5fbf3c79fd75235a2270284b1c7adfac17))

## v0.4.2 - 2017-08-23

### Changed

- Changed the way the bot handles command flags (like `--role` and `--user`) as a preparation for future features.
- Modified the event creation and updating behaviour so that end dates cannot be set before start dates.
- Event dates are now stored as ISODate objects in the database instead of Strings that contain ISO 8601 date representations.

### Fixed

- Fixed a bug where start dates were implied incorrectly in certain locations when the user did not supply a date in the `event` and `event update` commands, resulting in the bot thinking that the event starts in the past.

## v0.4.1 - 2017-08-22

### Changed

- Updated the bot's dependencies to solve certain issues.
- Changed the handling of how the bot loads the alternative prefix (bot mention).

### Fixed

- Invalid command entries should now make the bot provide an appropriate response.
- The bot's status message should now display properly, as a Discord API update broke the previous implementation of the status setter in the Eris library.

## v0.4.0 - 2017-08-18

### Added

- New `info` command allows users to see the bot's version, number of guilds and users serving, and uptime.
- New admin command set for the bot owner to perform restricted actions (like forcing errors for testing purposes) easily. Not accessible to any other users except for the bot owner.

### Changed

- The interaction between command declarations and its corresponding modules has been revised so that modules now return standardised responses, which the commands then interpret to send a response to the user on Discord.

### Fixed

- When a guild is deleted (i.e. the bot is kicked from a server), the scheduler module now unschedules events that are in the guild's calendar before deleting the calendar from the database. Previously, the bot would not unschedule those events, and would crash when attempting to send a scheduled notification message to the deleted guild.

## v0.3.2 - 2017-07-31

### Changed

- Changed error handling in the bot's event scheduling module to prevent the bot from crashing under certain situations.

## v0.3.1 - 2017-07-29

### Fixed

- Replaced prompts that incorrectly informed users to run `calendar <timezone>` with `init <timezone>`.

### Changed

- Replaced "Invalid input" messages with command usage guides.
- Changed the support server link provided in the `support` command to lead to the #welcome channel.

## v0.3.0 - 2017-07-27

### Added

- New `support` and `invite` commands displays links to the support server and to invite the bot to someone's server, respectively.

## v0.2.0 - 2017-07-26

### Added

- Guilds can now have custom prefixes for the bot.
- The bot will notify guild channels when an event is starting, and automatically remove events that have ended.
- Added a permissions system to control the usage of commands on a per-user and per-role basis.
- Error messages are now displayed on Discord when the bot encounters any errors.

### Changed

- Calendar and event data is now stored in a MongoDB database.
- The `event list` command now displays active and upcoming events separately.
- Active events can no longer be updated.
- Events can no longer be created or updated with a start date that is in the past.
- Internal: Files have been renamed to make its purpose more obvious (e.g. `event.command.js` is a file containing event-related commands).

## v0.1.0 - 2017-06-15

### Added

- Add calendar, event, ping and prefix commands.
- Store calendar and event data in a JSON file.
