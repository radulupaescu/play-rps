const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    entry: './src/game/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        clean: true,
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            '@babel/preset-env',
                            '@babel/preset-react'
                        ]
                    }
                }
            }
        ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/game/public/index.html'
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'src/game/model/rps-classifier',
                    to: 'rps-classifier'
                }
            ]
        })
    ],
    devServer: {
        static: './dist',
        historyApiFallback: true,
        hot: true
    },
    resolve: {
        extensions: ['.js', '.jsx']
    }
};
