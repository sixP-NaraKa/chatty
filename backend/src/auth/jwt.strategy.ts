import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {

    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: jwtConstants.secret
        });
    }

    // this will get attached to the initial @Request object as the "user" property (?) if we use this class as a Guard
    async validate(payload: any) {
        console.log("jwt.strategy => validate", payload);
        return { userId: payload.sub, username: payload.username };
    }
}