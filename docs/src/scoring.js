const t_spin = (board) => {
    if (board.current.c == 'T') {
        if (board.scoring.move_list.length && ["ROTATECCW", "ROTATECW"].includes(board.scoring.move_list[board.scoring.move_list.length - 1])) {
            switch (board.current.o) {
                case 0:
                    //x +/- 1, y + 1
                    return !!board.board.blocks[board.current.x - 1 + (board.current.y + 1) * board.board.width] + !!board.board.blocks[board.current.x + 1 + (board.current.y + 1) * board.board.width];
                case 1:
                    //x + 1, y +/- 1
                    return !!board.board.blocks[board.current.x + 1 + (board.current.y - 1) * board.board.width] + !!board.board.blocks[board.current.x + 1 + (board.current.y + 1) * board.board.width];
                case 2:
                    //x +/- 1, y - 1
                    return !!board.board.blocks[board.current.x - 1 + (board.current.y - 1) * board.board.width] + !!board.board.blocks[board.current.x + 1 + (board.current.y - 1) * board.board.width];
                case 3:
                    //x - 1, y +/- 1
                    return !!board.board.blocks[board.current.x - 1 + (board.current.y - 1) * board.board.width] + !!board.board.blocks[board.current.x - 1 + (board.current.y + 1) * board.board.width];
                default:
                    console.error(`Encountered invalid orientation ${o} in t_spin!`);
            }
        }
    }
    return 0;
};

const score_rows = (board, rows, clear) => {
    const pb2b = board.scoring.b2b;
    board.scoring.b2b = false;
    const t = t_spin(board);
    const level = compute_level(board);
    if (rows.length) {
        board.scoring.combo++;
        switch (rows.length) {
            case 1:
                switch (t) {
                    case 0:
                        board.scoring.score += 100 * level;
                        break;
                    case 1:
                        board.scoring.score += 200 * level * (pb2b ? 1.5 : 1);
                        board.scoring.b2b = true;
                        break;
                    case 2:
                        board.scoring.score += 800 * level * (pb2b ? 1.5 : 1);
                        board.scoring.b2b = true;
                        break;
                    default:
                        console.error(`Received t-spin of ${t} in score_rows 1!`);
                        break;
                }
                if (clear) {
                    board.scoring.score += 800 * level;
                }
                break;
            case 2:
                switch (t) {
                    case 0:
                        board.scoring.score += 300 * level;
                        break;
                    case 1:
                        board.scoring.score += 400 * level * (pb2b ? 1.5 : 1);
                        board.scoring.b2b = true;
                        break;
                    case 2:
                        board.scoring.score += 1200 * level * (pb2b ? 1.5 : 1);
                        board.scoring.b2b = true;
                        break;
                    default:
                        console.error(`Received t-spin of ${t} in score_rows 2!`);
                        break;
                }
                if (clear) {
                    board.scoring.score += 1200 * level;
                }
                break;
            case 3:
                switch (t) {
                    case 0:
                        board.scoring.score += 500 * level;
                        break;
                    case 1:
                        console.error(`Received t-spin of ${t} in triple!`);
                        break;
                    case 2:
                        board.scoring.score += 1600 * level * (pb2b ? 1.5 : 1);
                        board.scoring.b2b = true;
                        break;
                    default:
                        console.error(`Received t-spin of ${t} in score_rows 3!`);
                        break;
                }
                if (clear) {
                    board.scoring.score += 1800 * level;
                }
                break;
            case 4:
                board.scoring.score += 800 * level * (pb2b ? 1.5 : 1);
                board.scoring.b2b = true;
                if (clear) {
                    if (pb2b) {
                        board.scoring.score += 3200 * level;
                    } else {
                        board.scoring.score += 2000 * level;
                    }
                }
                break;
            default:
                console.error(`Found ${rows.length} rows were cleared!`);
        }
        board.scoring.cleared += rows.length;
    } else {
        switch (t) {
            case 0:
                break;
            case 1:
                board.scoring.score += 100 * level;
                board.scoring.b2b = pb2b;
                break;
            case 2:
                board.scoring.score += 400 * level;
                board.scoring.b2b = pb2b;
                break;
            default:
                console.error(`Received t-spin of ${t} in score_rows 0!`);
        }
        board.scoring.combo = -1;
    }
};