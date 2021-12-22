window.addEventListener('load', () => {
    let game = new_game();
    let accelerate = false;
    let gameloop_timer = 0;
    const control_state = {
        new_game: {
            hover: false,
            active: false
        },
        pause: {
            hover: false,
            active: false,
            on: false
        },
        mouse: {
            x: 0,
            y: 0,
            down: false
        }
    };
    const c_to_a = () => [game.current.x, game.current.y, game.current.o, game.current.c];
    const clear_lines = (rows) => {
        for (let y = 0; y < game.board.height; y++) {
            if (rows.includes(y)) {
                for (let x = 0; x < game.board.width; x++) {
                    game.board.blocks[y * game.board.width + x] = '';
                }
                continue;
            }
            let lines = 0;
            for (const row of rows) {
                if (y > row) {
                    lines++;
                }
            }
            if (lines) {
                for (let x = 0; x < game.board.width; x++) {
                    game.board.blocks[(y - lines) * game.board.width + x] = game.board.blocks[y * game.board.width + x];
                    game.board.blocks[y * game.board.width + x] = '';
                }
            }
        }
    };
    const defeat = () => {
        console.trace();
        game.defeated = true;
        window.clearInterval(gameloop_timer);
        draw_defeat(game);
    };
    const advance = () => {
        const time = Date.now();
        game.timing.advance = 0;
        game.current.c = game.preview.preview[game.preview.preview_idx];
        if (game.scoring.combo > -1) {
            redraw_board(game);
        }
        game.preview.preview[game.preview.preview_idx] = game.next_piece.next().value;
        redraw_preview(game);
        game.preview.preview_idx = (game.preview.preview_idx + 1) % game.preview.preview.length;
        if (!piece_valid(...c_to_a(), game)) {
            defeat();
        } else {
            game.timing.drop = time + compute_time(compute_level(game));
        }
    };
    const lock = () => {
        const time = Date.now();
        game.timing.lock = 0;
        map_piece_to_cells(...c_to_a()).forEach(([x, y]) => game.board.blocks[x + y * game.board.width] = game.current.c);
        let rows = [];
        let clear = true;
        for (let y = 0; y < game.board.height; y++) {
            let full = true;
            let maybeclear = true;
            for (let x = 0; x < game.board.width; x++) {
                if (!game.board.blocks[x + y * game.board.width]) {
                    full = false;
                    break;
                } else {
                    maybeclear = false;
                }
            }
            if (full) {
                rows.push(y);
            } else {
                clear = clear && maybeclear;
            }
        }
        score_rows(game, rows, clear);
        if (rows.length) {
            clear_lines(rows);
        }
        redraw_score(game);
        game.hold.hold_valid = true;
        game.scoring.move_list.length = 0;
        game.current.x = Math.floor(Math.random() * game.board.width / 2) + 2;
        game.current.y = 21;
        game.current.o = 0;
        game.current.c = '';
        game.timing.advance = time + compute_time(compute_level(game));
    };
    const erase = () => {
        if (game.current.c) {
            erase_piece(...c_to_a());
            erase_piece(game.current.x, hard_drop(...c_to_a(), game), game.current.o, game.current.c);
        }
    };
    const render = () => {
        if (game.current.c) {
            ghost_piece(game.current.x, hard_drop(...c_to_a(), game), game.current.o, game.current.c);
            redraw_piece(...c_to_a());
        }
    };
    const drop = () => {
        const time = Date.now();
        game.timing.drop = 0;
        if (!piece_valid(game.current.x, game.current.y - 1, game.current.o, game.current.c, game)) {
            game.timing.lock = time + 500;
        } else {
            game.scoring.move_list.push("drop");
            erase();
            game.current.y--;
            render();
            const delay =  compute_time(compute_level(game)) / (accelerate + 1);
            game.scoring.score += !!accelerate;
            if (accelerate) {
                redraw_score(game);
            }
            game.timing.drop = time + delay;
        }
    };
    const gameloop = () => {
        const time = Date.now();
        if (game.timing.advance && game.timing.advance < time) {
            advance();
        } else if (game.timing.drop && game.timing.drop < time) {
            drop();
        } else if (game.timing.lock && game.timing.lock < time) {
            lock();
        }
    };
    const pause = () => {
        const time = Date.now();
        game.game.paused = true;
        if (game.timing.advance) {
            game.timing.advance = Math.max(1, game.timing.advance - time);
        } else if (game.timing.drop) {
            game.timing.drop = Math.max(1, game.timing.drop - time);
        } else if (game.timing.lock) {
            game.timing.lock = Math.max(1, game.timing.lock - time);
        }
        window.clearInterval(gameloop_timer);
        gameloop_timer = 0;
    };
    const resume = () => {
        const time = Date.now();
        game.game.paused = false;
        if (game.timing.advance) {
            game.timing.advance += time;
        } else if (game.timing.drop) {
            game.timing.drop += time;
        } else if (game.timing.lock) {
            game.timing.lock += time;
        }
        gameloop_timer = window.setInterval(gameloop, 15);
    };
    const start = () => {
        if (game.game.paused) {
            control_state.pause.on = false;
            redraw_pause(intersects_pause(control_state.mouse.x, control_state.mouse.y), intersects_pause(control_state.mouse.x, control_state.mouse.y) && control_state.mouse.down, control_state.pause.on);
        }
        game = new_game();
        redraw_board(game);
        redraw_preview(game);
        redraw_level(compute_level(game));
        redraw_held('');
        redraw_score(game);
        advance();
        window.clearInterval(gameloop_timer);
        gameloop_timer = window.setInterval(gameloop, 15);
    };
    document.addEventListener('keyup', ev => {
        if (ev.ctrlKey || ev.altKey || ev.shiftKey || ev.metaKey || game.game.paused || game.game.defeated) {
            return;
        }
        switch (ev.key) {
            case 's':
                accelerate = false;
                break;
        }
    });
    document.addEventListener('keydown', ev => {
        if (ev.ctrlKey || ev.altKey || ev.shiftKey || ev.metaKey || game.game.paused || game.game.defeated) {
            return;
        }
        switch (ev.key) {
            case 'a':
                if (game.current.c) {
                    if (piece_valid(game.current.x - 1, game.current.y, game.current.o, game.current.c, game)) {
                        game.scoring.move_list.push(ev.key);
                        erase();
                        game.current.x--;
                        render();
                        if (game.timing.lock) {
                            game.timing.lock = 0;
                            game.timing.drop = Date.now() + 500;
                        }
                    }
                }
                break;
            case 'd':
                if (game.current.c) {
                    if (piece_valid(game.current.x + 1, game.current.y, game.current.o, game.current.c, game)) {
                        game.scoring.move_list.push(ev.key);
                        erase();
                        game.current.x++;
                        render();
                        if (game.timing.lock) {
                            game.timing.lock = 0;
                            game.timing.drop = Date.now() + 500;
                        }
                    }
                }
                break;
            case 'w':
                if (game.current.c) {
                    if (game.hold.hold_valid) {
                        game.hold.hold_valid = false;
                        const temp = game.hold.held.c;
                        game.hold.held.c = game.current.c;
                        redraw_held(game.hold.held.c);
                        erase();
                        game.current.c = temp;
                        game.current.y = 21;
                        game.current.o = 0;
                        game.timing.advance = game.timing.drop = game.timing.lock = 0;
                        game.scoring.move_list.length = 0;
                        if (!game.current.c) {
                            advance();
                        } else if (!piece_valid(...c_to_a(), game)) {
                            defeat();
                        } else {
                            drop();
                        }
                    }
                }
                break;
            case 's':
                accelerate = true;
                break;
            case ' ':
                if (game.current.c) {
                    game.scoring.move_list.push(ev.key);
                    const prev = game.current.y;
                    erase();
                    game.current.y = hard_drop(...c_to_a(), game);
                    render();
                    game.scoring.score += 2 * (prev - game.current.y);
                    redraw_score(game);
                    game.timing.advance = game.timing.drop = game.timing.lock = 0;
                    lock();
                }
                break;
            case 'q':
                if (game.current.c) {
                    [x, y, o] = rotate(...c_to_a(), -1, game);
                    if (o != game.current.o) {
                        game.scoring.move_list.push(ev.key);
                        erase();
                        game.current.x = x;
                        game.current.y = y;
                        game.current.o = o;
                        render();
                        if (game.timing.lock) {
                            game.timing.lock = 0;
                            game.timing.drop = Date.now() + 500;
                        }
                    }
                }
                break;
            case 'e':
                if (game.current.c) {
                    [x, y, o] = rotate(...c_to_a(), 1, game);
                    if (o != game.current.o) {
                        game.scoring.move_list.push(ev.key);
                        erase();
                        game.current.x = x;
                        game.current.y = y;
                        game.current.o = o;
                        render();
                        if (game.timing.lock) {
                            game.timing.lock = 0;
                            game.timing.drop = Date.now() + 500;
                        }
                    }
                }
                break;
            default:
                return;
        }
    });
    const canvas = document.getElementById('gameboard');
    canvas.addEventListener('pointerdown', ev => {
        control_state.mouse.x = ev.offsetX;
        control_state.mouse.y = ev.offsetY;
        control_state.mouse.down = true;
        const ing = intersects_new_game(control_state.mouse.x, control_state.mouse.y), ip = intersects_pause(control_state.mouse.x, control_state.mouse.y);
        if (ip && (!control_state.pause.hover || !control_state.pause.active)) {
            control_state.pause.hover = ip;
            control_state.pause.active = control_state.mouse.down;
            redraw_pause(control_state.pause.hover, control_state.pause.active, control_state.pause.on);
        }
        if (ing && (!control_state.new_game.hover || !control_state.new_game.active)) {
            control_state.new_game.hover = ing;
            control_state.new_game.active = control_state.mouse.down;
            redraw_ng(control_state.new_game.hover, control_state.new_game.active);
        }
    });
    canvas.addEventListener('pointerup', ev => {
        control_state.mouse.x = ev.offsetX;
        control_state.mouse.y = ev.offsetY;
        control_state.mouse.down = false;
        const ing = intersects_new_game(control_state.mouse.x, control_state.mouse.y), ip = intersects_pause(control_state.mouse.x, control_state.mouse.y);
        if (ip && control_state.pause.active) {
            control_state.pause.hover = ip;
            control_state.pause.active = control_state.mouse.down;
            (control_state.pause.on ? resume : pause)();
            control_state.pause.on = !control_state.pause.on;
            redraw_pause(control_state.pause.hover, control_state.pause.active, control_state.pause.on);
        }
        if (ing && control_state.new_game.active) {
            control_state.new_game.hover = ing;
            start();
            control_state.new_game.active = control_state.mouse.down;
            redraw_ng(control_state.new_game.hover, control_state.new_game.active);
        }
    });
    canvas.addEventListener('pointermove', ev => {
        control_state.mouse.x = ev.offsetX;
        control_state.mouse.y = ev.offsetY;
        const ing = intersects_new_game(control_state.mouse.x, control_state.mouse.y), ip = intersects_pause(control_state.mouse.x, control_state.mouse.y);
        if (ip != control_state.pause.hover || ip && control_state.mouse.down != control_state.pause.active) {
            control_state.pause.hover = ip;
            control_state.pause.active = control_state.mouse.down;
            redraw_pause(control_state.pause.hover, control_state.pause.active, control_state.pause.on);
        }
        if (ing != control_state.new_game.hover || ing && control_state.mouse.down != control_state.new_game.active) {
            control_state.new_game.hover = ing;
            control_state.new_game.active = control_state.mouse.down;
            redraw_ng(control_state.new_game.hover, control_state.new_game.active);
        }
    });
    window.addEventListener('pointerup', ev => control_state.mouse.down = false);
    window.addEventListener('pointerdown', ev => control_state.mouse.down = true);
    redraw_backing();
    redraw_board(game);
    redraw_preview(game);
    redraw_level(compute_level(game));
    redraw_held('');
    redraw_score(game);
    redraw_ng(false, false);
    redraw_pause(false, false, false);
});