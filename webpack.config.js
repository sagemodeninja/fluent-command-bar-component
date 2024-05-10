const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (_, argv) => {
    const isDev = argv.mode === 'development';

    return {
        target: 'web',
        entry: isDev ? './src/app.ts' : './src/index.ts',
        output: {
            filename: isDev ? 'bundle.js' : 'fluent-command-bar-component.js',
            path: path.resolve(__dirname, 'dist'),
            library: 'FluentCommandBar',
            libraryTarget: 'umd',
            clean: true,
        },
        plugins: isDev && [
            new HtmlWebpackPlugin({ template: 'public/index.html' }),
            new MiniCssExtractPlugin(),
        ],
        module: {
            rules: [
                isDev
                    ? {
                        test: /\.css$/i,
                        use: [MiniCssExtractPlugin.loader, 'css-loader'],
                    }
                    : {},
                {
                    test: /\.ts$/,
                    use: 'ts-loader',
                    exclude: /node_modules/,
                },
            ],
        },
        resolve: {
            extensions: ['.ts', '.js'],
        },
        devServer: isDev
            ? {
                static: {
                    directory: path.join(__dirname, 'dist'),
                },
                compress: true,
                https: false,
                port: 3000,
            }
            : {},
        devtool: isDev ? 'inline-source-map' : 'source-map',
    }
};
