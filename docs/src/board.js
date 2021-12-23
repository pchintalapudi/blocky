const spawn_row = 20;
const spawn_height = spawn_row - 1;
const new_game = () => {
    const width = 10, height = spawn_row + 1;
    const pieces = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];
    function *next_piece() {
        while (true) {
            grab_bag = pieces.map(p => ({p, key:Math.random()})).sort((k1, k2) => k1.key - k2.key).map(({p}) => p);
            for (const piece of grab_bag) {
                yield piece;
            }
        }
    }
    const board = {
        board: {
            width,
            height,
            blocks: Array.from(Array(width * height)).map(() => '')
        },
        hold: {
            hold_valid: true,
            held: {x: 0, y:spawn_height, o:0, c:''}
        },
        preview: {
            preview: [],
            preview_idx: 0
        },
        current: {x:0, y:spawn_height, o:0, c:''},
        scoring: {
            score: 0,
            move_list: [],
            b2b: false,
            combo: -1,
            cleared: 8
        },
        game: {
            paused: false,
            defeated: false
        },
        next_piece: next_piece(),
        timing: {
            advance: 0,
            drop: 0,
            lock: 0
        }
    };
    for (let i = 0; i < 14; i++) {
        board.preview.preview.push(board.next_piece.next().value);
    }
    return board;
};

const map_i_rotated = (x, y, o) => {
    switch (o) {
        case 0:
            return [[x - 2, y], [x - 1, y], [x, y], [x + 1, y]];
        case 1:
            return [[x, y + 1], [x, y], [x, y - 1], [x, y - 2]];
        case 2:
            return [[x - 2, y - 1], [x - 1, y - 1], [x, y - 1], [x + 1, y - 1]];
        case 3:
            return [[x - 1, y + 1], [x - 1, y], [x - 1, y - 1], [x - 1, y - 2]];
        default:
            console.error(`Invalid orientation ${o} during rotation!`);
            break;
    }
};
const map_j_rotated = (x, y, o) => {
    switch (o) {
        case 0:
            return [[x - 1, y + 1], [x - 1, y], [x, y], [x + 1, y]];
        case 1:
            return [[x + 1, y + 1], [x, y + 1], [x, y], [x, y - 1]];
        case 2:
            return [[x - 1, y], [x, y], [x + 1, y], [x + 1, y - 1]];
        case 3:
            return [[x - 1, y - 1], [x, y - 1], [x, y], [x, y + 1]];
        default:
            console.error(`Invalid orientation ${o} during rotation!`);
            break;
    }
};
const map_l_rotated = (x, y, o) => {
    switch (o) {
        case 0:
            return [[x - 1, y], [x, y], [x + 1, y], [x + 1, y + 1]];
        case 1:
            return [[x, y + 1], [x, y], [x, y - 1], [x + 1, y - 1]];
        case 2:
            return [[x - 1, y - 1], [x - 1, y], [x, y], [x + 1, y]];
        case 3:
            return [[x - 1, y + 1], [x, y + 1], [x, y], [x, y - 1]];
        default:
            console.error(`Invalid orientation ${o} during rotation!`);
            break;
    }
};
const map_o_rotated = (x, y, o) => {
    switch (o) {
        case 0:
        case 1:
        case 2:
        case 3:
            break;     
        default:
            console.error(`Invalid orientation ${o} during rotation!`);
            return;
    }
    return [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]];
};
const map_s_rotated = (x, y, o) => {
    switch (o) {
        case 0:
            return [[x - 1, y], [x, y], [x, y + 1], [x + 1, y + 1]];
        case 1:
            return [[x, y + 1], [x, y], [x + 1, y], [x + 1, y - 1]];
        case 2:
            return [[x - 1, y - 1], [x, y - 1], [x, y], [x + 1, y]];
        case 3:
            return [[x - 1, y + 1], [x - 1, y], [x, y], [x, y - 1]];
        default:
            console.error(`Invalid orientation ${o} during rotation!`);
            break;
    }
};
const map_t_rotated = (x, y, o) => {
    switch (o) {
        case 0:
            return [[x - 1, y], [x, y], [x, y + 1], [x + 1, y]];
        case 1:
            return [[x, y + 1], [x, y], [x, y - 1], [x + 1, y]];
        case 2:
            return [[x - 1, y], [x, y], [x, y - 1], [x + 1, y]];
        case 3:
            return [[x, y + 1], [x, y], [x, y - 1], [x - 1, y]];
        default:
            console.error(`Invalid orientation ${o} during rotation!`);
            break;
    }
};
const map_z_rotated = (x, y, o) => {
    switch (o) {
        case 0:
            return [[x - 1, y + 1], [x, y + 1], [x, y], [x + 1, y]];
        case 1:
            return [[x, y - 1], [x, y], [x + 1, y], [x + 1, y + 1]];
        case 2:
            return [[x - 1, y], [x, y], [x, y - 1], [x + 1, y - 1]];
        case 3:
            return [[x - 1, y - 1], [x - 1, y], [x, y], [x, y + 1]];
        default:
            console.error(`Invalid orientation ${o} during rotation!`);
            break;
    }
};

const map_piece_to_cells = (x, y, o, c) => ({I:map_i_rotated, J:map_j_rotated, L:map_l_rotated, O:map_o_rotated, S:map_s_rotated, T:map_t_rotated, Z:map_z_rotated}[c](x, y, o));

const _valid = (x, y, board) => x >= 0 && x < board.board.width && y >= 0 && y < board.board.height && !board.board.blocks[y * board.board.width + x];

const piece_valid = (x, y, o, c, board) => map_piece_to_cells(x, y, o, c).map(coords => _valid(...coords, board)).reduce((was_valid, is_valid) => was_valid && is_valid, true);

const jlstz_kicks = [[0, 0], [-1, 0], [-1, +1], [0, -2], [-1, -2]];
const jlstz_modifiers = [[1, 1], [-1, -1], [-1, 1], [1, -1]];

const rotate_jlstz = (x, y, o, c, d, board) => {
    const modifiers = jlstz_modifiers[d > 0 ? o : (o + 4 - 1) % 4];
    for (const [k_x, k_y] of jlstz_kicks) {
        const out = [x + k_x * d * modifiers[0], y + k_y * d * modifiers[1], (o + d + 4) % 4];
        if (piece_valid(...out, c, board)) {
            return out;
        }
    }
    return [x, y, o];
}

const i_kicks = [
    [[0, 0], [-2, 0], [1, 0], [-2, -1], [1, 2]],
    [[0, 0], [-1, 0], [2, 0], [-1, 2], [2, -1]],
    [[0, 0], [2, 0], [-1, 0], [2, 1], [-1, -2]],
    [[0, 0], [1, 0], [-2, 0], [1, -2], [1, -2]]
];

const rotate_i = (x, y, o, d, board) => {
    for (const [k_x, k_y] of i_kicks[d > 0 ? o : (o + 4 - 1) % 4]) {
        const out = [x + k_x * d, y + k_y * d, (o + d + 4) % 4];
        if (piece_valid(...out, 'I', board)) {
            return out;
        }
    }
    return [x, y, o];
};

const rotate = (x, y, o, c, d, board) => {
    switch (c) {
        case 'O':
            return [x, y, o];
        case 'I':
            return rotate_i(x, y, o, d, board);
        case 'J':
        case 'L':
        case 'S':
        case 'T':
        case 'Z':
            return rotate_jlstz(x, y, o, c, d, board);
        default:
            console.error(`Invalid piece type '${c}' in rotate!`);
    }
};

const hard_drop = (x, y, o, c, board) => {
    while (piece_valid(x, --y, o, c, board));
    return ++y;
};

const compute_level = (board) => {
    const div = Math.floor(board.scoring.cleared / 10);
    const root = Math.floor((Math.sqrt(1 + 8 * div) - 1) / 2);
    return Math.max(root + 1, 1);
};

const compute_time = (level) => 1000 * Math.pow((0.8 - ((level - 1) * 0.007)), level);