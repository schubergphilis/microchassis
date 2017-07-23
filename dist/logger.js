var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { injectable } from 'inversify';
import { Config } from './config';
let Logger = class Logger {
    constructor(config) {
        this.config = config;
        this.logLevel = config.logLevel;
    }
    info(message) {
        console.log(`[info] ${message}`);
    }
    warn(message) {
        console.log(`[warn] ${message}`);
    }
    error(message) {
        console.log(`[error] ${message}`);
    }
    audit(message) {
        console.log(`[audit] ${message}`);
    }
    debug(message) {
        console.log(`[debug] ${message}`);
    }
};
Logger = __decorate([
    injectable(),
    __metadata("design:paramtypes", [Config])
], Logger);
export { Logger };
//# sourceMappingURL=logger.js.map