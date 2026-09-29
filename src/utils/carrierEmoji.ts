import { type EmojiGlyph, glyphFromCodepoints } from './emojis.js'

export type EmojiCarrier = 'au' | 'docomo' | 'softbank' | 'google'

// Each carrier's emoji ids as emoji4unicode maps them to Unicode, in runs of consecutive ids from
// the first one. A `-` is an id it maps to no Unicode character, a `.` an id the carrier never used.
// See: https://github.com/google/emoji4unicode/blob/5019c2da8c4fa80286ae9cca7d89e062fb8704be/data/emoji4unicode.xml.
const carrierCodes: Record<EmojiCarrier, Array<[number, Array<string>]>> = {
  // au's icon number.
  au: [
    [
      1,
      [
        '26a0 2757 2753 - 25c0 25b6 23ea 23e9 25ab 25aa',
        '2139 1f377 1f50a 1f4b2 1f319 26a1 25fd 25fe 1f538 1f539',
        '25fb 25fc 26aa 26ab 231a 2795 2796 2733 2b06 2b07',
        '1f6ab 1f53d 1f53c 23ec 23eb 1f536 1f537 2b1c 2b1b 1f534',
        '1f535 2196 2198 2600 26be 23f0 1f31b 1f514 1f4cd 1f469',
        '2764 1f378 1f340 2122 2716 1f4c3 231b 23f3 1f4be 2744',
        '274c 274e 27a1 2b05 1f37a 2797 1f4c5 263a 2b50 2197',
        '2199 1f48d 2714 1f429 1f320 2747 1f4a1 1f424 1f4c1 1f468',
        '00a9 00ae 1f45c 1f4c2 260e 1f4ac 1f4b3 1f53a 1f53b 1f1fa_1f1f8',
        '1f4d4 1f4cb 2615 1f4f7 2614 1f3c8 1f4d7 26d4 1f6a5 1f4d8',
        '1f4d9 1f4d5 1f4c4 2702 1f4c6 1f3ab 2601 2709 1f4b4 1f3a5',
        '1f4f9 1f3e0 1f337 1f52a 1f4fc 1f453 21aa 21a9 1f50d 1f511',
        '1f4d3 1f4d6 1f529 1f460 1f697 1f4bd 1f4ca 1f4c8 1f4ea 1f526',
        '1f4c7 2705 1f341 1f436 1f50b 1f4dc 1f4cc 1f512 1f4b5 1f448',
        '1f449 1f4d2 1f4ce 1f381 1f4db 1f374 1f4da 1f69a 270f -',
        '1f4e8 1f527 1f4e4 1f4e5 1f4de 1f3e2 1f4cf 1f4d0 1f4c9 1f356',
        '1f4f1 1f50c 1f46a 1f517 1f4e6 1f4e0 26c5 2708 26f5 1f3b2',
        '1f4f0 1f683 - - - 1f6ac 1f6ad 267f 1f530 0031_20e3',
        '0032_20e3 0033_20e3 0034_20e3 0035_20e3 0036_20e3 0037_20e3 0038_20e3 0039_20e3 1f51f 1f300',
        '26c4 2648 2649 264a 264b 264c 264d 264e 264f 2650',
        '2651 2652 2653 26ce 1f3e7 1f3ea 1f6bb 1f17f 1f68f 1f4e1',
        '2693 1f3e6 26fd 1f5fe 1f6b2 1f68c 1f685 1f3c3 26bd 1f3be',
        '1f3c2 1f3c1 1f3a1 2668 1f3ee 1f3ac 1f309 1f5fc 1f3b0 1f38a',
        '1f3af 1f3ae 1f4b0 1f384 1f338 1f47b 1f1ef_1f1f5 1f349 1f370 1f373',
        '1f352 1f421 1f353 1f359 1f354 1f433 1f430 1f434 1f435 1f438',
        '1f431 1f427 1f41c 1f437 1f334 1f33b 1f603 1f620 1f62d 1f62b',
        '1f4a4 1f4a2 1f4a7 1f61c 1f494 1f495 2734 1f4a3 1f525 1f198',
        '1f4aa 1f498 1f48b 1f47e 1f365 1f43e 1f47f 1f4ae 3299 1f4af',
        '1f44a 1f4a8 1f4a9 261d 1f250 1f480 1f44d 1f4fa 1f3a4 1f45b',
        '1f3b6 1f3b8 1f3bb 1f3a7 1f484 1f52b 1f486 - 1f193 1f4bf',
        '1f45a 1f47d 1f199 1f489 1f301 26f3 1f3c0 1f4df 1f3a8 1f3ad',
        '1f3aa 1f380 1f382 2660 2666 2663 1f440 1f442 270c 270b',
        '1f311 1f314 1f313 1f191 0030_20e3 1f197 1f635 1f49e 1f4a5 1f4a6',
        '- 1f30f 1f35c 1f195 1f455 1f45e 1f4bb 1f4fb 1f339 26ea',
        '1f687 1f5fb 1f3b5 1f47c 1f42f 1f43b 1f42d 1f609 1f60d 1f631',
        '1f613 1f419 1f680 1f451 1f48f 1f528 1f386 1f342 1f4bc 26f2',
        '26fa 1f004 1f19a 1f3c6 1f422 1f1ea_1f1f8 1f1f7_1f1fa 1f6a7 1f6c0 1f38c',
        '1f306 1f423 1f4b9 1f46e 1f3e3 1f3e5 1f3eb 1f3e8 1f6a2 1f51e',
        '1f4f6 1f192 1f239 1f202 1f194 1f235 1f233 1f22f 1f23a 1f446',
        '1f447 1f52e 1f4f3 1f4f4 1f4dd 1f454 1f33a 1f490 1f335 1f376',
        '1f37b 3297 1f48a 1f388 1f389 - 1f452 1f462 1f485 1f487',
        '1f488 1f458 1f459 2665 1f496 1f499 1f49a 1f49b 1f49c 2728',
        '1f3bf 2b55 1f375 1f35e 1f366 1f35f 1f361 1f358 1f35a 1f35d',
        '1f35b 1f362 1f363 1f34e 1f34a 1f345 1f346 1f371 1f372 1f60f',
        '1f614 1f624 1f623 1f616 1f62a 1f60c 1f628 1f637 1f633 1f612',
        '1f632 1f630 1f3bc 1f60a 1f61a 1f618 1f443 1f444 1f64f 1f44f',
        '1f44c 1f44e 1f44b 1f645 1f646 1f647 1f491 1f46f 1f3ba 1f3b1',
        '1f3ca 1f692 1f691 1f693 1f3a2 1f38d 1f38e 1f393 1f392 1f38f',
        '1f302 1f470 1f367 1f387 1f41a 1f390 1f383 1f391 1f385 1f303',
        '1f308 1f3e9 1f305 1f3a9 1f3ec 1f3ef 1f3f0 1f3ed 1f1eb_1f1f7 -',
        '1f510 1f520 1f521 1f522 1f523 1f251 2611 2712 1f518 1f50e',
        '1f519 1f516 1f4f2 1f3e1 1f4eb 1f4d1 1f50f 1f503 . .',
      ],
    ],
    [
      691,
      [
        '. . . . . . . . . 1f1e9_1f1ea',
        '1f1ee_1f1f9 1f1ec_1f1e7 1f1e8_1f1f3 1f1f0_1f1f7 1f471 1f472 1f473 1f474 1f475 1f476',
        '1f477 1f478 1f42c 1f483 1f420 1f41b 1f418 1f428 1f42e 1f40d',
        '1f414 1f417 1f42b 1f170 1f171 1f17e 1f18e 1f463 1f45f 1f6a9',
        '2934 2935 2049 203c 27b0 1f348 1f34d 1f347 1f34c 1f33d',
        '1f344 1f330 1f351 1f360 1f355 1f357 1f38b 1f379 1f432 1f3b9',
        '1f3c4 1f3a3 1f3b3 1f479 1f47a 1f43c 1f445 1f43d 1f33c 1f368',
        '1f369 1f36a 1f36b 1f36c 1f36d 1f648 1f64a 1f649 1f30b 1f49d',
        '1f524 1f36e 1f41d 1f41e 1f36f 1f34f 1f4b8 1f4ab 1f621 1f63e',
        '1f30c 1f63d 1f63a 1f4e9 1f639 1f602 1f63b 1f640 1f629 1f63f',
        '1f622 1f63c 1f457 1f5ff 1f689 1f3b4 1f0cf 1f364 1f4e7 1f6b6',
        '1f6a8 - 1f493 1f425 1f456 1f48c 267b 2194 2195 1f30a',
        '1f331 1f40c 1f638 1f601 - 1f33f 270a 0023_20e3 1f64b 1f64c',
        '1f64d 1f64e - - - - - -',
      ],
    ],
  ],
  // Docomo numbers its basic set 1 to 176 and its extended set 1001 to 1076.
  docomo: [
    [
      1,
      [
        '2600 2601 2614 26c4 26a1 1f300 1f301 1f302 2648 2649',
        '264a 264b 264c 264d 264e 264f 2650 2651 2652 2653',
        '1f3bd 26be 26f3 1f3be 26bd 1f3bf 1f3c0 1f3c1 1f4df 1f683',
        '24c2 1f684 1f697 1f699 1f68c 1f6a2 2708 1f3e0 1f3e2 1f3e3',
        '1f3e5 1f3e6 1f3e7 1f3e8 1f3ea 26fd 1f17f 1f6a5 1f6bb 1f374',
        '2615 1f378 1f37a 1f354 1f460 2702 1f3a4 1f3a5 2197 1f3a0',
        '1f3a7 1f3a8 1f3a9 1f3aa 1f3ab 1f6ac 1f6ad 1f4f7 1f45c 1f4d6',
        '1f380 1f381 1f382 260e 1f4f1 1f4dd 1f4fa 1f3ae 1f4bf 2665',
        '2660 2666 2663 1f440 1f442 270a 270c 270b 2198 2196',
        '1f463 1f45f 1f453 267f 1f311 1f314 1f313 1f319 1f315 1f436',
        '1f431 26f5 1f384 2199 1f4f2 1f4e9 1f4e0 - - 2709',
        '- - 1f4b4 1f193 1f194 1f511 21a9 1f191 1f50d 1f195',
        '1f6a9 27bf 0023_20e3 - 0031_20e3 0032_20e3 0033_20e3 0034_20e3 0035_20e3 0036_20e3',
        '0037_20e3 0038_20e3 0039_20e3 0030_20e3 1f197 2764 1f493 1f494 1f495 1f603',
        '1f620 1f61e 1f616 1f635 2934 1f3b5 2668 1f4a0 1f48b 2728',
        '1f4a1 1f4a2 1f44a 1f4a3 1f3b6 2935 1f4a4 2757 2049 203c',
        '1f4a5 1f4a6 1f4a7 1f4a8 3030 27b0 1f3ac 1f45d 2712 1f464',
        '1f4ba 1f303 1f51c 1f51b 1f51a 23f0',
      ],
    ],
    [
      1001,
      [
        '- - 1f455 1f45b 1f484 1f456 1f3c2 1f514 1f6aa 1f4b0',
        '1f4bb 1f48c 1f527 270f 1f451 1f48d 23f3 1f6b2 1f375 231a',
        '1f614 1f60c 1f605 1f613 1f621 1f612 1f60d 1f44d 1f61c 1f609',
        '1f606 1f623 1f60f 1f62d 1f622 1f196 1f4ce 00a9 2122 1f3c3',
        '3299 267b 00ae 26a0 1f232 1f233 1f234 1f235 2194 2195',
        '1f3eb 1f30a 1f5fb 1f340 1f352 1f337 1f34c 1f34e 1f331 1f341',
        '1f338 1f359 1f370 1f376 1f35c 1f35e 1f40c 1f424 1f427 1f41f',
        '1f60b 1f601 1f434 1f437 1f377 1f631',
      ],
    ],
  ],
  // SoftBank's emoji in the order of their codes, from U+E001.
  softbank: [
    [
      1,
      [
        '1f466 1f467 1f48b 1f468 1f469 1f455 1f45f 1f4f7 260e 1f4f1',
        '1f4e0 1f4bb 1f44a 1f44d 261d 270a 270c 270b 1f3bf 26f3',
        '1f3be 26be 1f3c4 26bd 1f41f 1f434 1f697 26f5 2708 1f683',
        '1f685 2753 2757 2764 1f494 1f550 1f551 1f552 1f553 1f554',
        '1f555 1f556 1f557 1f558 1f559 1f55a 1f55b 1f338 1f531 1f339',
        '1f384 1f48d 1f48e 1f3e0 26ea 1f3e2 1f689 26fd 1f5fb 1f3a4',
        '1f3a5 1f3b5 1f511 1f3b7 1f3b8 1f3ba 1f374 1f378 2615 1f370',
        '1f37a 26c4 2601 2600 2614 1f319 1f304 1f47c 1f431 1f42f',
        '1f43b 1f436 1f42d 1f433 1f427 1f60a 1f603 1f61e 1f620 1f4a9',
        '1f4eb 1f4ee 1f4e9 1f4f2 1f61c 1f60d 1f631 1f613 1f435 1f419',
        '1f437 1f47d 1f680 1f451 1f4a1 1f340 1f48f 1f381 1f52b 1f50d',
        '1f3c3 1f528 1f386 1f341 1f342 1f47f 1f47b 1f480 1f525 1f4bc',
        '1f4ba 1f354 26f2 26fa 2668 1f3a1 1f3ab 1f4bf 1f4c0 1f4fb',
        '1f4fc 1f4fa 1f47e 303d 1f004 1f19a 1f4b0 1f3af 1f3c6 1f3c1',
        '1f3b0 1f40e 1f6a4 1f6b2 1f6a7 1f6b9 1f6ba 1f6bc 1f489 1f4a4',
        '26a1 1f460 1f6c0 1f6bd 1f50a 1f4e2 1f38c 1f512 1f513 1f306',
        '1f373 1f4d6 1f4b1 1f4b9 1f4e1 1f4aa 1f3e6 1f6a5 1f17f 1f68f',
        '1f6bb 1f46e 1f3e3 1f3e7 1f3e5 1f3ea 1f3eb 1f3e8 1f68c 1f695',
        '1f6b6 1f6a2 1f201 1f49f 2734 2733 1f51e 1f6ad 1f530 267f',
        '1f4f6 2665 2666 2660 2663 0023_20e3 27bf 1f195 1f199 1f192',
        '1f236 1f21a 1f237 1f238 1f534 1f532 1f533 0031_20e3 0032_20e3 0033_20e3',
        '0034_20e3 0035_20e3 0036_20e3 0037_20e3 0038_20e3 0039_20e3 0030_20e3 1f250 1f239 1f202',
        '1f194 1f235 1f233 1f22f 1f23a 1f446 1f447 1f448 1f449 2b06',
        '2b07 27a1 2b05 2197 2196 2198 2199 25b6 25c0 23e9',
        '23ea 1f52f 2648 2649 264a 264b 264c 264d 264e 264f',
        '2650 2651 2652 2653 26ce 1f51d 1f197 00a9 00ae 1f4f3',
        '1f4f4 26a0 1f481 - - - - - - -',
        '1f4dd 1f454 1f33a 1f337 1f33b 1f490 1f334 1f335 1f6be 1f3a7',
        '1f376 1f37b 3297 1f6ac 1f48a 1f388 1f4a3 1f389 2702 1f380',
        '3299 1f4bd 1f4e3 1f452 1f457 1f461 1f462 1f484 1f485 1f486',
        '1f487 1f488 1f458 1f459 1f45c 1f3ac 1f514 1f3b6 1f493 1f497',
        '1f498 1f499 1f49a 1f49b 1f49c 2728 2b50 1f4a8 1f4a6 2b55',
        '274c 1f4a2 1f31f 2754 2755 1f375 1f35e 1f366 1f35f 1f361',
        '1f358 1f35a 1f35d 1f35c 1f35b 1f359 1f362 1f363 1f34e 1f34a',
        '1f353 1f349 1f345 1f346 1f382 1f371 1f372 1f625 1f60f 1f614',
        '1f601 1f609 1f623 1f616 1f62a 1f61d 1f60c 1f628 1f637 1f633',
        '1f612 1f630 1f632 1f62d 1f602 1f622 263a 1f604 1f621 1f61a',
        '1f618 1f440 1f443 1f442 1f444 1f64f 1f44b 1f44f 1f44c 1f44e',
        '1f450 1f645 1f646 1f491 1f647 1f64c 1f46b 1f46f 1f3c0 1f3c8',
        '1f3b1 1f3ca 1f699 1f69a 1f692 1f691 1f693 1f3a2 1f687 1f684',
        '1f38d 1f49d 1f38e 1f393 1f392 1f38f 1f302 1f492 1f30a 1f367',
        '1f387 1f41a 1f390 1f300 1f33e 1f383 1f391 1f343 1f385 1f305',
        '1f307 1f303 1f308 1f3e9 1f3a8 1f3a9 1f3ec 1f3ef 1f3f0 1f3a6',
        '1f3ed 1f5fc - 1f1ef_1f1f5 1f1fa_1f1f8 1f1eb_1f1f7 1f1e9_1f1ea 1f1ee_1f1f9 1f1ec_1f1e7 1f1ea_1f1f8',
        '1f1f7_1f1fa 1f1e8_1f1f3 1f1f0_1f1f7 1f471 1f472 1f473 1f474 1f475 1f476 1f477',
        '1f478 1f5fd 1f482 1f483 1f42c 1f426 1f420 1f424 1f439 1f41b',
        '1f418 1f428 1f412 1f411 1f43a 1f42e 1f430 1f40d 1f414 1f417',
        '1f42b 1f438 1f170 1f171 1f18e 1f17e 1f463 2122 - -',
        '- - - - -',
      ],
    ],
  ],
  // Google's id, the low bits of its U+FExxx code.
  google: [
    [
      0x000,
      [
        '2600 2601 2614 26c4 26a1 1f300 1f301 1f302',
        '1f303 1f304 1f305 1f306 1f307 1f308 2744 26c5',
        '1f309 1f311 1f314 1f313 1f319 1f315 1f31b 1f391',
        '1f51c 1f51b 1f51a 23f3 231b 231a 1f550 1f551',
        '1f552 1f553 1f554 1f555 1f556 1f557 1f558 1f559',
        '1f55a 1f55b 23f0 2648 2649 264a 264b 264c',
        '264d 264e 264f 2650 2651 2652 2653 26ce',
        '1f30a 1f30f 1f30b 1f30c 1f340 1f337 1f331 1f341',
        '1f338 1f339 1f342 1f343 1f530 1f33a 1f33b 1f334',
        '1f335 1f33e 1f33d 1f344 1f330 1f33c 1f33f 1f352',
        '1f34c 1f34e 1f34a 1f353 1f349 1f345 1f346 1f348',
        '1f34d 1f347 1f351 1f34f . . . .',
      ],
    ],
    [
      0x190,
      [
        '1f440 1f442 1f443 1f444 1f445 1f484 1f485 1f486',
        '1f487 1f488 1f464 1f466 1f467 1f468 1f469 1f46a',
        '1f46b 1f46e 1f46f 1f470 1f471 1f472 1f473 1f474',
        '1f475 1f476 1f477 1f478 1f479 1f47a 1f47b 1f47c',
        '1f47d 1f47e 1f47f 1f480 1f481 1f482 1f483 1f436',
        '1f431 1f40c 1f424 1f425 1f427 1f41f 1f434 1f437',
        '1f42f 1f43b 1f42d 1f433 1f435 1f419 1f41a 1f42c',
        '1f426 1f420 1f439 1f41b 1f418 1f428 1f412 1f411',
        '1f43a 1f42e 1f430 1f40d 1f414 1f417 1f42b 1f438',
        '1f429 1f421 1f41c 1f43e 1f422 1f423 1f432 1f43c',
        '1f43d 1f41d 1f41e - . . . .',
      ],
    ],
    [
      0x320,
      [
        '1f620 1f629 1f632 1f61e 1f635 1f630 1f612 1f60d',
        '1f624 1f61c 1f61d 1f60b 1f618 1f61a 1f637 1f633',
        '1f603 1f605 1f606 1f601 1f602 1f60a 263a -',
        '1f604 1f622 1f62d 1f628 1f623 1f621 1f60c 1f616',
        '1f614 1f631 1f62a 1f60f 1f613 1f625 1f62b 1f609',
        '1f63a 1f638 1f639 1f63d 1f63b 1f63f 1f63e 1f63c',
        '1f640 1f645 1f646 1f647 1f648 1f64a 1f649 1f64b',
        '1f64c 1f64d 1f64e 1f64f - - - -',
        '- - - - - - - -',
        '- - . . . . . .',
      ],
    ],
    [
      0x4b0,
      [
        '1f3e0 1f3e1 1f3e2 1f3e3 1f3e5 1f3e6 1f3e7 1f3e8',
        '1f3e9 1f3ea 1f3eb 26ea 26f2 1f3ec 1f3ef 1f3f0',
        '1f3ed 2693 1f3ee 1f5fb 1f5fc - 1f5fd 1f5fe',
        '1f5ff 1f527 1f528 1f529 1f45e 1f45f 1f453 1f455',
        '1f456 1f451 1f531 1f454 1f452 1f457 1f460 1f461',
        '1f462 1f458 1f459 1f45a 1f45b 1f4b0 1f4b1 1f4b9',
        '1f4b2 1f4b3 1f4b4 1f4b5 1f4b8 1f1ef_1f1f5 1f1fa_1f1f8 1f1eb_1f1f7',
        '1f1e9_1f1ea 1f1ee_1f1f9 1f1ec_1f1e7 1f1ea_1f1f8 1f1f7_1f1fa 1f1e8_1f1f3 1f1f0_1f1f7 1f4f7',
        '1f45c 1f45d 1f514 1f6aa 1f4a9 1f52b 1f525 1f52e',
        '1f52f 1f4f9 1f52a 1f526 1f50b 1f4dc 1f50c 1f4d7',
        '1f4d8 1f4d9 1f4d5 1f4da 1f4db 1f6c0 1f6bb 1f6bd',
        '1f6be 1f489 1f48a 1f170 1f171 1f18e 1f17e 1f380',
        '1f381 1f382 1f384 1f385 1f38c 1f386 1f388 1f389',
        '1f38d 1f38e 1f393 1f392 1f38f 1f387 1f390 1f383',
        '1f38a 1f38b 1f4df 260e 1f4de 1f4f1 1f4f2 1f4dd',
        '1f4e0 2709 1f4e8 1f4e9 1f4ea 1f4eb 1f4ee 1f4e2',
        '1f4e3 1f4e1 1f4ac 1f4e4 1f4e5 1f4e6 2712 1f4ba',
        '1f4bb 270f 1f4ce 1f4bc 1f4bd 1f4be 2702 1f4cd',
        '1f4c3 1f4c4 1f4c5 1f4c1 1f4c2 1f4d3 1f4d6 1f4d4',
        '1f4cb 1f4c6 1f4ca 1f4c8 1f4c9 1f4c7 1f4cc 1f4d2',
        '1f4cf 1f4d0 1f4d1 1f463 . . . .',
      ],
    ],
    [
      0x7d0,
      [
        '1f3bd 26be 26f3 1f3be 26bd 1f3bf 1f3c0 1f3c1',
        '1f3c2 1f3c3 1f3c4 1f3c6 1f40e 1f3c8 1f3ca 1f683',
        '1f687 24c2 1f684 1f685 1f697 1f699 1f68c 1f68f',
        '1f6a2 2708 26f5 1f6b2 1f689 1f680 1f6a4 1f695',
        '1f6b6 1f69a 1f692 1f691 1f693 26fd 1f17f 1f6a5',
        '1f6a7 1f6a8 2668 26fa 1f3a0 1f3a1 1f3a2 1f3a3',
        '1f3a4 1f3a5 1f3a6 1f3a7 1f3a8 1f3a9 1f3aa 1f3ab',
        '1f3ac 1f3ad 1f3ae 1f004 1f3af 1f3b0 1f3b1 1f3b2',
        '1f3b3 1f3b4 1f0cf 1f3b5 1f3b6 1f3b7 1f3b8 1f3b9',
        '1f3ba 1f3bb 1f3bc 303d 1f4fa 1f4bf 1f4c0 1f4fb',
        '1f4fc 1f50a 1f4f0 1f48b 1f48c 1f48d 1f48e 1f48f',
        '1f490 1f491 1f492 27bf 0023_20e3 - 0031_20e3 0032_20e3',
        '0033_20e3 0034_20e3 0035_20e3 0036_20e3 0037_20e3 0038_20e3 0039_20e3 0030_20e3',
        '1f4f6 1f4f3 1f4f4 1f51f - . . .',
      ],
    ],
    [
      0x960,
      [
        '1f354 1f359 1f370 1f35c 1f35e 1f373 1f366 1f35f',
        '1f361 1f358 1f35a 1f35d 1f35b 1f362 1f363 1f371',
        '1f372 1f367 1f356 1f365 1f360 1f355 1f357 1f368',
        '1f369 1f36a 1f36b 1f36c 1f36d 1f36e 1f36f 1f364',
        '1f374 2615 1f378 1f37a 1f375 1f376 1f377 1f37b',
        '1f379 . . . . . . .',
      ],
    ],
    [
      0xaf0,
      [
        '2197 2198 2196 2199 2934 2935 2194 2195',
        '2b06 2b07 27a1 2b05 25b6 25c0 23e9 23ea',
        '1f53d 1f53c 23ec 23eb 2757 2049 203c 3030',
        '27b0 2753 2754 2755 2764 1f493 1f494 1f495',
        '1f496 1f497 1f498 1f499 1f49a 1f49b 1f49c 1f49d',
        '1f49e 1f49f 2665 2660 2666 2663 1f6ac 1f6ad',
        '267f 1f193 1f6a9 26a0 1f201 1f51e 26d4 1f197',
        '1f196 00a9 2122 3299 267b 00ae 1f232 1f233',
        '1f234 1f235 1f19a 1f6b9 1f6ba 1f6bc 1f195 1f199',
        '1f192 1f236 1f21a 1f237 1f238 1f250 1f239 1f202',
        '1f22f 1f23a 1f51d 3297 2b55 274c 274e 2139',
        '1f6ab 2714 2705 1f517 - - - 1f198',
        '1f251 2795 2796 2716 2797 1f4a0 1f4a1 1f4a2',
        '1f4a3 1f4a4 1f4a5 1f4a6 1f4a7 1f4a8 1f4aa 1f4ab',
        '2728 2734 2733 1f534 1f535 26aa 26ab 1f533',
        '2b50 1f31f 1f320 2b1c 2b1b 25ab 25aa 25fd',
        '25fe 25fb 25fc 1f536 1f537 1f538 1f539 2747',
        '1f53a 1f53b 1f4ae 1f4af 1f520 1f521 1f522 1f523',
        '1f524 1f194 1f511 21a9 1f191 1f50d 1f512 1f513',
        '21aa - 1f510 2611 1f518 1f50e 1f519 1f516',
        '1f50f 1f503 1f4e7 270a 270c 270b 1f44a 1f44d',
        '261d 1f446 1f447 1f448 1f449 1f44b 1f44f 1f44c',
        '1f44e 1f450 - . . . . .',
      ],
    ],
    [
      0xe10,
      [
        '- - - - - - - -',
        '- - - - - - - -',
        '- - - - - - - -',
        '- - - - - - - -',
        '- - - - . . . .',
      ],
    ],
    [0xe40, ['- - - - - - - -', '- - - . . . . .']],
    [0xe70, ['- - - - - - - -', '- - - - - - . .']],
    [0xea0, ['-']],
  ],
}

const tables: Partial<Record<EmojiCarrier, Map<number, EmojiGlyph>>> = {}

// Built on the first lookup, since most content carries no carrier emoji at all.
const getTable = (carrier: EmojiCarrier): Map<number, EmojiGlyph> => {
  const cached = tables[carrier]

  if (cached) {
    return cached
  }

  const table = new Map<number, EmojiGlyph>()

  for (const [first, lines] of carrierCodes[carrier]) {
    for (const [offset, code] of lines.join(' ').split(' ').entries()) {
      if (code === '.') {
        continue
      }

      table.set(first + offset, code === '-' ? false : (glyphFromCodepoints(code) ?? false))
    }
  }

  tables[carrier] = table

  return table
}

// The glyph for a carrier's emoji id, false for one with no Unicode counterpart, undefined for an
// id the carrier never used.
export const glyphFromCarrierEmoji = (
  carrier: EmojiCarrier,
  id: number,
): EmojiGlyph | undefined => {
  return getTable(carrier).get(id)
}
