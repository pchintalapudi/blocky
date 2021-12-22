let canvas;
const drawOptions = {
    scale: 30,
    height: 20,
    controlsWidth: 150,
    gameWidth: 300,
    ng_bounds: { x: 20, y: 180, w: 110, h: 55 },
    pause_bounds: { x: 20, y: 260, w: 110, h: 55 },
};

const get_color = (c) => {
    switch (c) {
        case '':
        case 'DEFEAT':
            return [0, 0, 0];
        case 'I':
            return [0, 1, 1];
        case 'J':
            return [0, 0, 1];
        case 'L':
            return [1, 0.65, 0];
        case 'O':
            return [1, 1, 0];
        case 'S':
            return [0, 1, 0];
        case 'T':
            return [1, 0, 1];
        case 'Z':
            return [1, 0, 0];
        default:
            console.error(`Unexpected color '${c}' in draw function!`);
    }
};

const rasterize = (color, multiplier = 1) => `rgb(${color.map(p => Math.min(255, Math.floor(256 * p * multiplier))).join(',')})`

const render_cell = (x, y, c) => {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = 'white';
    ctx.fillStyle = c;
    ctx.fillRect(x, y, drawOptions.scale, drawOptions.scale);
    ctx.strokeRect(x, y, drawOptions.scale, drawOptions.scale);
};

const draw_cell = (x, y, c) => {
    if (y >= drawOptions.height) {
        return;
    }
    render_cell(x * drawOptions.scale + drawOptions.controlsWidth, (drawOptions.height - y - 1) * drawOptions.scale, rasterize(get_color(c)));
};

const ghost_cell = (x, y, c) => {
    if (y >= drawOptions.height) {
        return;
    }
    render_cell(x * drawOptions.scale + drawOptions.controlsWidth, (drawOptions.height - y - 1) * drawOptions.scale, rasterize(get_color(c), 3 / 8));
};

const erase_cell = (x, y) => draw_cell(x, y, '');

const redraw_board = (board) => {
    for (let y = 0; y < board.board.height; y++) {
        for (let x = 0; x < board.board.width; x++) {
            draw_cell(x, y, board.board.blocks[x + y * board.board.width]);
        }
    }
};

const redraw_piece = (x, y, o, c) => map_piece_to_cells(x, y, o, c).map(coords => draw_cell(...coords, c));
const erase_piece = (x, y, o, c) => map_piece_to_cells(x, y, o, c).map(coords => erase_cell(...coords));
const ghost_piece = (x, y, o, c) => map_piece_to_cells(x, y, o, c).map(coords => ghost_cell(...coords, c));

const redraw_backing = () => {
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = rasterize(get_color(''));
    ctx.strokeStyle = 'white';
    ctx.fillRect(0, 0, drawOptions.controlsWidth * 2 + drawOptions.gameWidth, 600);
    ctx.strokeRect(0, 0, drawOptions.controlsWidth, 600);
    ctx.strokeRect(drawOptions.controlsWidth + drawOptions.gameWidth, 0, drawOptions.controlsWidth, 600);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 35px ui-monospace';
    ctx.fillText('Preview', drawOptions.controlsWidth / 2, 30);
    ctx.fillText('Held', drawOptions.controlsWidth + drawOptions.gameWidth + drawOptions.controlsWidth / 2, 30);
    redraw_logo();
};
const redraw_preview = (board) => {
    const piece = board.preview.preview[(board.preview.preview_idx + 1) % board.preview.preview.length];
    const startX = 15, startY = drawOptions.scale * 2 + startX;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = rasterize(get_color(''));
    ctx.fillRect(startX - 1, startY - 1, drawOptions.scale * 4 + 2, drawOptions.scale * 2 + 2);
    const map_coords = ([x, y]) => [x * drawOptions.scale + startX, (1 - y) * drawOptions.scale + startY];
    map_piece_to_cells(2, 0, 0, piece).map(map_coords).forEach(coords => render_cell(...coords, rasterize(get_color(piece))));
};
const redraw_level = (level) => {
    const ctx = canvas.getContext('2d');
    ctx.font = 'bold 72px ui-monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center'
    ctx.fillStyle = rasterize(get_color(''));
    ctx.fillRect(drawOptions.controlsWidth + drawOptions.gameWidth + 1, drawOptions.scale * 5 + 15, drawOptions.controlsWidth - 2, 72);
    ctx.fillStyle = rasterize(get_color('J'));
    ctx.fillText(`${level}`, drawOptions.controlsWidth + drawOptions.gameWidth + drawOptions.controlsWidth / 2, drawOptions.scale * 5 + 15 + 36);
};
const redraw_held = (c) => {
    const start = 15;
    const startX = start + drawOptions.controlsWidth + drawOptions.gameWidth, startY = drawOptions.scale * 2 + start;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = rasterize(get_color(''));
    ctx.fillRect(startX - 1, startY - 1, drawOptions.scale * 4 + 2, drawOptions.scale * 2 + 2);
    if (c) {
        const map_coords = ([x, y]) => [x * drawOptions.scale + startX, (1 - y) * drawOptions.scale + startY];
        map_piece_to_cells(2, 0, 0, c).map(map_coords).forEach(coords => render_cell(...coords, rasterize(get_color(c))));
    }
};
const redraw_score = (board) => {
    redraw_level(compute_level(board));
    const ctx = canvas.getContext('2d');
    ctx.font = '24px ui-monospace';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center'
    ctx.fillStyle = rasterize(get_color(''));
    ctx.fillRect(drawOptions.controlsWidth + drawOptions.gameWidth + 1, drawOptions.scale * 5 + 15 + 72 + 15, drawOptions.controlsWidth - 2, 20);
    ctx.fillStyle = 'white';
    ctx.fillText(`${board.scoring.score}`, drawOptions.controlsWidth + drawOptions.gameWidth + drawOptions.controlsWidth / 2, drawOptions.scale * 5 + 15 + 72 + 15 + 12);
};//TODO
const redraw_logo = () => {};//TODO
const redraw_ng = (hover, active) => {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = rasterize(get_color('Z'));
    ctx.fillStyle = rasterize([hover + active, hover + active, hover + active], 1 / 10);
    ctx.fillRect(drawOptions.ng_bounds.x, drawOptions.ng_bounds.y, drawOptions.ng_bounds.w, drawOptions.ng_bounds.h);
    ctx.strokeRect(drawOptions.ng_bounds.x, drawOptions.ng_bounds.y, drawOptions.ng_bounds.w, drawOptions.ng_bounds.h);
    ctx.font = "bold 25px ui-monospace";
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center'
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText('Restart', drawOptions.ng_bounds.x + drawOptions.ng_bounds.w / 2, drawOptions.ng_bounds.y + drawOptions.ng_bounds.h / 2, drawOptions.ng_bounds.w);
};
const redraw_pause = (hover, active, on) => {
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = rasterize(get_color(on ? 'S' : 'O'));
    ctx.fillStyle = rasterize([hover + active, hover + active, hover + active], 1 / 10);
    ctx.fillRect(drawOptions.pause_bounds.x, drawOptions.pause_bounds.y, drawOptions.pause_bounds.w, drawOptions.pause_bounds.h);
    ctx.strokeRect(drawOptions.pause_bounds.x, drawOptions.pause_bounds.y, drawOptions.pause_bounds.w, drawOptions.pause_bounds.h);
    ctx.font = "bold 25px ui-monospace";
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center'
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fillText(on ? 'Resume' : 'Pause', drawOptions.pause_bounds.x + drawOptions.pause_bounds.w / 2, drawOptions.pause_bounds.y + drawOptions.pause_bounds.h / 2, drawOptions.pause_bounds.w);
};

const intersects_new_game = (mx, my) => mx >= drawOptions.ng_bounds.x && mx < drawOptions.ng_bounds.x + drawOptions.ng_bounds.w && my >= drawOptions.ng_bounds.y && my < drawOptions.ng_bounds.y + drawOptions.ng_bounds.h;
const intersects_pause = (mx, my) => mx >= drawOptions.pause_bounds.x && mx < drawOptions.pause_bounds.x + drawOptions.pause_bounds.w && my >= drawOptions.pause_bounds.y && my < drawOptions.pause_bounds.y + drawOptions.pause_bounds.h;

const draw_defeat = (board) => {
    const pieces = [];
    for (let y = 0; y < board.board.height; y++) {
        for (let x = 0; x < board.board.width; x++) {
            pieces.push({coord:[x, y], key:Math.random()});
        }
    }
    pieces.sort((k1, k2) => k1.key - k2.key);
    let hide_timer = 0;
    hide_timer = window.setInterval(() => {
        const [x, y] = pieces.pop().coord;
        draw_cell(x, y, "DEFEAT");
        if (!pieces.length) {
            window.clearInterval(hide_timer);
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.fillRect(drawOptions.controlsWidth, 0, drawOptions.scale * board.board.width, drawOptions.scale * board.board.height);
            ctx.font = "bold 50px ui-monospace";
            ctx.fillStyle = '#ff0000';
            ctx.textBaseline = 'middle';
            ctx.textAlign = 'center'
            ctx.fillText("GAME", drawOptions.controlsWidth + drawOptions.gameWidth / 2, 50);
            ctx.fillText("OVER", drawOptions.controlsWidth + drawOptions.gameWidth / 2, 100);
        }
    }, 4);
};

window.addEventListener('load', () => {
    canvas = document.getElementById("gameboard");
    const resize = () => {
        const scale = Math.min(window.innerWidth / 600, window.innerHeight / 600);
        const tx = (window.innerWidth / 2 - scale * 600 / 2) / scale, ty = (window.innerHeight / 2 - scale * 600 / 2) / scale;
        canvas.style = `transform-origin:top left;transform:scale(${scale}, ${scale}) translate(${tx}px, ${ty}px)`;
    };
    window.addEventListener('resize', resize);
    resize();
});
