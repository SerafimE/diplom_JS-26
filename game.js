'use strict';

class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    plus(vector) {
        if (!(vector instanceof Vector)) {
            throw new Error('Можно прибавлять к вектору только вектор типа Vector');
        }
        return new Vector(this.x + vector.x, this.y + vector.y);
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
        }
        this.pos = pos;
        this.size = size;
        this.speed = speed;
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
        this.player = actors.find((actor) => (actor.type === 'player'));
        this.height = (grid) ? grid.length : 0;
        this.width = (grid.length) ? Math.max(...(grid.map((line) => (line.length)))) : 0;
        this.status = null;
        this.finishDelay = 1;
    }

    isFinished() {
        return this.status !== null && this.finishDelay < 0;
    }

    actorAt(actorObj) {
        if ((!(actorObj instanceof Actor)) || (actorObj === undefined)) {
            throw new Error('not Actor');
        }
        return this.actors.find(elem => elem.isIntersect(actorObj));
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
        if (this.actors.indexOf(actorObj !== -1)) {
            this.actors.splice(this.actors.findIndex((obj) => (obj === actorObj)), 1);
        }
    }

    noMoreActors(typeObj) {
        return !(this.actors.some((actor) => (actor.type === typeObj)));
    }

    playerTouched(type, obj) {
        if (!(this.status === null)) {
            return;
        }
        if ((type === 'lava') || (type === 'fireball')) {
            this.status = 'lost';
        } else if (type === 'coin') {
            this.removeActor(obj);
            this.noMoreActors(type) ? this.status = 'won' : '';
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
            }
        }
    }

    obstacleFromSymbol(symbolStr) {
        if (symbolStr === 'x') {
            return 'wall';
        } else if (symbolStr === '!') {
            return 'lava';
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

class Fireball extends Actor {
    constructor(
        pos = new Vector(0, 0),
        speed = new Vector(0, 0)) {
        super(pos, new Vector(1, 1), speed);
    }

    get type() {
        return 'fireball';
    }

    getNextPosition(time = 1) {
        let newPos = new Vector(this.pos.x, this.pos.y);
        return newPos.plus(this.speed.times(time));
    }

    handleObstacle() {
        this.speed = this.speed.times(-1);
    }

    act(time, playField) {
        const nextPosition = this.getNextPosition(time);
        if (!playField.obstacleAt(nextPosition, this.size)) {
            this.pos = nextPosition;
        } else {
            this.handleObstacle();
        }
    }
}

class HorizontalFireball extends Fireball {
    constructor(pos) {
        super(pos, new Vector(2, 0));
    }
}

class VerticalFireball extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 2));
    }
}

class FireRain extends Fireball {
    constructor(pos) {
        super(pos, new Vector(0, 3));
        this.startPos = pos;
    }

    handleObstacle() {
        this.pos = this.startPos;
    }
}

class Coin extends Actor {
    constructor(pos) {
        super(pos, new Vector(0.6, 0.6), new Vector());
        this.basePos = this.pos;
        this.pos = this.pos.plus(new Vector(0.2, 0.1));
        this.springSpeed = 8;
        this.springDist = 0.07;
        this.spring = Math.random() * Math.PI * 2;
    }

    get type() {
        return 'coin';
    }

    updateSpring(time = 1) {
        this.spring += this.springSpeed * time;
    }

    getSpringVector() {
        return new Vector(0, this.springDist * Math.sin(this.spring));
    }

    getNextPosition(time = 1) {
        this.updateSpring(time);
        return this.basePos
            .plus(this.getSpringVector())
            .plus(new Vector(0.2, 0.1));
    }

    act(time) {
        this.pos = this.getNextPosition(time);
    }
}

class Player extends Actor {
    constructor(pos) {
        super(pos, new Vector(0.8, 1.5), new Vector(0, 0));
        this.basePos = this.pos;
        this.pos = this.pos.plus(new Vector(0, -0.5));
    }

    get type() {
        return 'player';
    }
}

const actorDict = {
    '@': Player,
    'v': FireRain,
    'o': Coin,
    '=': HorizontalFireball,
    '|': VerticalFireball
};

const parser = new LevelParser(actorDict);

loadLevels().then(levels => runGame(JSON.parse(levels), parser, DOMDisplay)
    .then(() => console.log('Вы выиграли!')));
