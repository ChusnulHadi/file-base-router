import express from "express";
import pino from "pino"
import createRouter from "express-file-routing";
import { config } from "dotenv";
import hpp from "hpp";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieSession from "cookie-session";
import morgan from "morgan";
import errorPage from "./404";

config();

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

type ServerOptions = {
    port?: number;
    host?: string;
    onListen?: () => void;
    onError?: (error: any) => void;
}
/**
 * Class for initiate the express server
 * @param port - Port number for the server
 * @param host - Host name for the server. this can be an IP address or a domain name
 * @param onListen - Callback function to be called when the server is started
 * @param onError - Callback function to be called when the server encounters an error
 * 
 */
class Server {
    private app: express.Express; // express app instance
    public port: number; // port number for the server
    public host: string; // host name for the server
    private logger: pino.Logger; // logger instance

    constructor({
        port,
        host,
        onListen,
        onError
    }: ServerOptions) {
        // map the props to the class properties
        this.port = port || 3000;
        this.host = host || 'localhost';
        this.onListen = onListen || this.onListen.bind(this);
        this.onError = onError || this.onError.bind(this);

        // initiate private properties
        this.logger = pino({
            level: 'info'
        })

        // initiate express app
        this.app = express();
        this.app.use(hpp());
        this.app.use(morgan('tiny', {

        }))
        this.app.use(cors());
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieSession({
            name: 'session',
            keys: [process.env.COOKIEKEY || 'key1'],
        }));
    }

    private onListen() {
        this.logger.info(`Server is running on ${this.host}:${this.port}`)
    }

    private onError(error: any) {
        this.logger.error(error)
    }

    // private onRequest(stream: any) {
    //     this.logger.info(`${stream.res.statusCode} ${stream.method}: ${stream.originalUrl}`)
    // }

    /**
     * Start the express server
     * 
     * This method will create the router and start the server
     * 
    **/
    public start() {
        createRouter(this.app).then((app) => {
            app.listen(this.port, this.host, this.onListen).on('error', (error) => {
                if (this.onError) {
                    this.onError(error);
                } else {
                    this.logger.error(error);
                }
            });

            app.use((_, res) => {
                res.status(404).send(errorPage);
            });
        }).catch((error) => {
            if (this.onError) {
                this.onError(error);
            } else {
                this.logger.error(error);
            }
        });
    }
}

const App = new Server({
    port: Number(PORT),
    host: HOST
})
App.start()