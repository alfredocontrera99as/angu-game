import { Component, OnInit } from '@angular/core';
import * as PIXI from 'pixi.js';
import { fromEvent } from 'rxjs';
import { tap } from 'rxjs/operators';
export abstract class Actor extends PIXI.Graphics {
  update(delta: number) {}

  onKeydown(e: KeyboardEvent) {}

  onKeyup(e: KeyboardEvent) {}

  lerp(start: number, end: number, amt: number) {
    return (1 - amt) * start + amt * end;
  }
}
export class Background extends Actor {
  private space = 20;
  constructor() {
    super();

    this.beginFill(0x222222);
    var width = 20;
    for (let i = 0; i < width * width; i++) {
      this.drawRect(0, i * this.space, width * width * width, 1);
      this.drawRect(i * this.space, 0, 1, width * width * width);
    }
    this.endFill();
  }
}
export enum KeyboardMap {
  Left = 37,
  Top = 38,
  Right = 39,
  Bottom = 40,
}
export interface IHashTable<TValue> {
  [key: number]: TValue;
}
export class Snake extends Actor {
  private lastUnix: number = 0;
  private threshold: number = 100;
  private directionMap: IHashTable<Direction> = {};

  constructor() {
    super();
    this.directionMap[KeyboardMap.Left] = Direction.West;
    this.directionMap[KeyboardMap.Right] = Direction.East;
    this.directionMap[KeyboardMap.Top] = Direction.North;
    this.directionMap[KeyboardMap.Bottom] = Direction.South;
    for (let i = 0; i < 10; i++) {
      this.addChild(
        new SnakeCell(i, 0, this.children[Math.max(0, i - 1)] as SnakeCell)
      );
    }
  }

  override update(delta: number) {
    var currentUnix = performance.now();
    var canResetUnix = false;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i] as SnakeCell;
      canResetUnix = currentUnix - this.lastUnix >= this.threshold;
      if (canResetUnix) {
        child.update();
      }
    }
    if (canResetUnix) {
      this.lastUnix = performance.now();
    }
  }
  override onKeydown(e: KeyboardEvent) {
    var direction = this.directionMap[e.keyCode];
    if (direction === undefined) {
      return;
    }

    var head = this.children[this.children.length - 1] as SnakeCell;
    head.changeDirection(direction);
  }
}
export enum Direction {
  North,
  East,
  South,
  West,
}
export class SnakeCell extends Actor {
  public tileX: number;
  public tileY: number;

  private next: SnakeCell | undefined = void 0;
  private radius: number = 10;
  private directionX: number = 1;
  private directionY: number = 0;
  constructor(x: number, y: number, prev: SnakeCell) {
    super();

    this.tileX = x;
    this.tileY = y;

    if (prev) {
      prev.next = this;
    }
    this.beginFill(0xccefef);
    this.drawCircle(0, 0, this.radius);
    this.endFill();

    var worldPosition = this.getWorldPosition();
    this.position.x = worldPosition.x;
    this.position.y = worldPosition.y;
  }

  getWorldPosition() {
    var tileSize = 20;
    return {
      x: this.tileX * tileSize + this.radius,
      y: this.tileY * tileSize + this.radius,
    };
  }
  changeDirection(direction: Direction) {
    this.directionY = 0;
    this.directionX = 0;
    switch (direction) {
      case Direction.South:
        this.directionY = 1;
        return;
      case Direction.North:
        this.directionY = -1;
        return;
      case Direction.East:
        this.directionX = 1;
        return;
      case Direction.West:
        this.directionX = -1;
        return;
    }
  }
  smoothUpdate(delta: number) {
    var speed = 60 / 1000;
    var position = this.getWorldPosition();
    this.position.x = this.lerp(this.position.x, position.x, speed * delta);
    this.position.y = this.lerp(this.position.y, position.y, speed * delta);
  }
  override update() {
    if (!this.next) {
      this.tileX += this.directionX;
      this.tileY += this.directionY;
    } else {
      this.tileX = this.next.tileX;
      this.tileY = this.next.tileY;
    }
    var position = this.getWorldPosition();
    this.position.x = position.x;
    this.position.y = position.y;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
})
export class AppComponent implements OnInit {
  title = 'snake';
  private app = new PIXI.Application<HTMLCanvasElement>({
    width: (window.innerWidth * 99) / 100,
    height: (window.innerHeight * 99) / 100,
  });
  private actors: Actor[] = [];

  ngOnInit(): void {
    document.body.appendChild(this.app.view);
    this.actors.push(new Background());
    this.actors.push(new Snake());
    this.initActors();
  }
  initActors() {
    for (let i = 0; i < this.actors.length; i++) {
      const actor = this.actors[i];
      this.app.stage.addChild(actor);
      this.app.ticker.add((e) => actor.update(e));
    }
    fromEvent(document, 'keydown')
      .pipe(
        tap((e: any) => {
          for (let i = 0; i < this.actors.length; i++) {
            const actor = this.actors[i];
            actor.onKeydown(e);
          }
        })
      )
      .subscribe();
    fromEvent(document, 'keyup')
      .pipe(
        tap((e: any) => {
          for (let i = 0; i < this.actors.length; i++) {
            const actor = this.actors[i];
            actor.onKeyup(e);
          }
        })
      )
      .subscribe();
  }
}
