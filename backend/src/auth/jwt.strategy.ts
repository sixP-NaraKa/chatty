import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants.js';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret ?? process.env.JWT_SECRET,
        });
    }

    // using now a Middleware before this gets called
    // this will get attached to the initial @Request object as the "user" property (if used as Guard)
    async validate(payload: any) {
        // can be modify this payload before it gets here? not sure
        // return false;
        return { userId: payload.sub, username: payload.username };
    }
}
