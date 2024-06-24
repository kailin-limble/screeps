let map = {
    // spawns can't be placed programmatically
    sim: {
        [STRUCTURE_SPAWN]: [
            [25,25],
        ],
        [STRUCTURE_EXTENSION]: [
            [33,2], 
            [33,20], 
            [35,22],
            [45,43],
            [42,46], 
            [32,3], 
            [32,21], 
            [34,23],
            [45,42],
            [41,46], 
        ],
        [STRUCTURE_ROAD]: [
            [27,20],
            [27,21],
            [27,22],
            [27,23],
            [26,24],
            [26,25],
            [26,26],
            [28,23],
            [29,23],
            [30,23],
            [31,23],
            [32,23],
            [33,22],
            [34,21],
            [40,41],
            [41,42],
            [41,43],
            [42,42],
            [34,3],
        ],
        [STRUCTURE_WALL]: [
            [16,10],
            [16,11],
            [5,20],
            [5,21],
            [5,22],
            [5,28],
            [5,29],
            [5,30],
            [5,31],
            [48,21],
            [47,21],
            [47,22],
            [47,28],
            [47,29],
            [48,29],
            [21,48],
            [21,47],
            [22,47],
            [28,47],
            [29,47],
            [29,48],
        ],
        [STRUCTURE_RAMPART]: [
            [16,12],
            [17,12],
            [19,13],
            [20,13],
            [5,23],
            [5,24],
            [5,25],
            [5,26],
            [5,27],
            [47,23],
            [47,24],
            [47,25],
            [47,26],
            [47,27],
            [23,47],
            [24,47],
            [25,47],
            [26,47],
            [27,47],
            [6,32],
            [7,34]
        ],
        [STRUCTURE_TOWER]: [
            [13,41]
        ],
        [STRUCTURE_PORTAL]: [
        ],
        [STRUCTURE_CONTROLLER]: [
        ],
        [STRUCTURE_LINK]: [
        ],
        [STRUCTURE_STORAGE]: [
        ],
        [STRUCTURE_OBSERVER]: [
        ],
        [STRUCTURE_POWER_BANK]: [
        ],
        [STRUCTURE_POWER_SPAWN]: [
        ],
        [STRUCTURE_EXTRACTOR]: [
        ],
        [STRUCTURE_LAB]: [
        ],
        [STRUCTURE_TERMINAL]: [
        ],
        [STRUCTURE_CONTAINER]: [
        ],
        [STRUCTURE_NUKER]: [
        ],
        [STRUCTURE_FACTORY]: [
        ]
    }
}

module.exports = map;