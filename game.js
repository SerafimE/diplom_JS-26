'use strict';
const z = console.log; // для отладки

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Можно прибавлять к вектору только вектор типа Vector');
        } else {
            return new Vector(this.x + vector.x, this.y + vector.y);
        }
    }

    times(multiplier) {
        return new Vector(this.x * multiplier, this.y * multiplier);
    }
}

class Actor {
    constructor(
        pos = new Vector(0, 0),
        size = new Vector(1, 1),
        speed = new Vector(0, 0)) {
        if ((!(pos instanceof Vector)) ||
            (!(size instanceof Vector)) ||
            (!(speed instanceof Vector))) {
            throw new Error('not Vector');
        } else {
            this.pos = pos;
            this.size = size;
            this.speed = speed;
        }
    }

    act() {
    }

    get left() {
        return this.pos.x;
    }

    get top() {
        return this.pos.y;
    }

    get right() {
        return this.pos.x + this.size.x;
    }

    get bottom() {
        return this.pos.y + this.size.y;
    }

    get type() {
        return 'actor';
    }

    isIntersect(actor) {
        if (!(actor instanceof Actor)) {
            throw new Error('not Vector');
        }
        if (this === actor) {
            return false;
        }
        return this.right > actor.left && this.left < actor.right && this.top < actor.bottom && this.bottom > actor.top;
    }
}

class Level {
    constructor(grid = [], actors = []) {
        this.grid = grid;
        this.actors = actors;

        if (this.actors) {
            this.player = this.actors.find(elem => {
                if (elem.type === 'player') {
                    return elem;
                }
            });
        }

        this.status = null;
        this.finishDelay = 1;

        if (this.grid.length) {
            this.height = this.grid.length;
            this.width = Math.max.apply(null, this.grid.map(item => item.length));
        } else {
            this.width = 0;
            this.height = 0;
        }
    }

    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(actorObj) {
        if (actorObj instanceof Actor) {
            return this.actors.find(elem => elem.isIntersect(actorObj));
        } else {
            throw new Error('not Actor');
        }
    }

    obstacleAt(position, size) {
        if (!(position instanceof Vector) || !(size instanceof Vector)) {
            throw new Error('not Vector');
        }
        const borderLeft = Math.floor(position.x);
        const borderRight = Math.ceil(position.x + size.x);
        const borderTop = Math.floor(position.y);
        const borderBottom = Math.ceil(position.y + size.y);

        if (borderLeft < 0 || borderRight > this.width || borderTop < 0) {
            return 'wall';
        }
        if (borderBottom > this.height) {
            return 'lava';
        }

        for (let y = borderTop; y < borderBottom; y++) {
            for (let x = borderLeft; x < borderRight; x++) {
                const gridLevel = this.grid[y][x];
                if (gridLevel) {
                    return gridLevel;
                }
            }
        }
    }

    removeActor(actorObj) {
        if (this.actors.indexOf(actorObj) !== -1) {
            this.actors.findIndex((elem, index, array) => {
                if (elem === actorObj) {
                    array.splice(index, 1);
                }
            });
        }
    }

    noMoreActors(typeObj) {
        if (this.actors.length === 0) {
            return true;
        }
        if (this.actors.find(elem => elem.type === typeObj)) {
            return false;
        } else {
            return true;
        }
    }

    playerTouched(type, obj) {
        if (this.status !== 'null') {
            if (type === 'lava' ||
                type === 'fireball') {
                this.status = 'lost';
            } else if (type === 'coin' && obj) {
                this.removeActor(obj);
                if (this.noMoreActors('coin')) {
                    this.status = 'won';
                }
            }
        }
    }
}

class LevelParser {
    constructor(movingObjectDictionary) {
        this.movingObjectDictionary = movingObjectDictionary;
    }

    actorFromSymbol(simbolStr) {
        if (simbolStr) {
            if (simbolStr in this.movingObjectDictionary) {
                return this.movingObjectDictionary[simbolStr];
            } else {
                return undefined;
            }
        } else {
            return undefined;
        }
    }

    obstacleFromSymbol(symbolStr) {
        if (symbolStr === 'x') {
            return 'wall';
        } else if (symbolStr === '!') {
            return 'lava';
        } else {
            return undefined;
        }
    }

    createGrid(arrayStr) {
        if (arrayStr.length === 0) {
            return [];
        }
        let grid = [];
        for (let str of arrayStr) {
            let gridString = [];
            for (let sym of str) {
                gridString.push(this.obstacleFromSymbol(sym));
            }
            grid.push(gridString);
        }
        return grid;
    }

    createActors(actorsList) {
        const actorsArr = [];
        if (actorsList.length === 0) {
            return actorsArr;
        }
        if (!this.movingObjectDictionary) {
            return actorsArr;
        }

        actorsList.forEach((value, index) => {
            for (let i = 0; i < value.length; i++) {
                if (typeof this.movingObjectDictionary[value[i]] === 'function') {
                    let Elem = Object(this.movingObjectDictionary[value[i]]);
                    let actor = new Elem(new Vector(i, index));
                    if (actor instanceof Actor) {
                        actorsArr.push(actor);
                    }
                }
            }
        });
        return actorsArr;
    }

    parse(arrayStr) {
        const gridObj = this.createGrid(arrayStr),
            gridAct = this.createActors(arrayStr);
        return new Level(gridObj, gridAct);
    }
}
