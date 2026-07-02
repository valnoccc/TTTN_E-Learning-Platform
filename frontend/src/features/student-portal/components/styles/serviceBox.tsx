import styled from "styled-components";
import { colors } from "../common/element/elements";

export const Styles = styled.div`
    .service-area {
        padding: 56px 0 42px;

        .container {
            width     : 80%;
            max-width : 80%;
            margin    : 0 auto;
        }

        @media(max-width: 1399px) {
            .container {
                width     : 88%;
                max-width : 88%;
            }
        }

        @media(max-width: 991px) {
            .container {
                width     : 92%;
                max-width : 92%;
            }
        }

        @media(max-width: 767px) {
            .container {
                width        : 100%;
                max-width    : 100%;
                padding-left : 15px;
                padding-right: 15px;
            }
        }

        .sec-title {
            h4 {
                color        : ${colors.black1};
                font-size    : 32px;
                line-height  : 45px;
                font-weight  : 700;
                max-width    : 700px;
                margin       : auto;
                margin-bottom: 40px;

                @media(max-width: 575px) {
                    margin-bottom: 15px;
                    font-size: 24px;
                    line-height: 34px;
                }
            }
        }

        .service-box {
            padding   : 35px 20px 20px;
            box-shadow: 0 12px 25px rgba(0, 0, 0, 0.07);
            border-radius : 5px;
            margin-bottom: 30px;

            .box-icon {
                background  : ${colors.green};
                height      : 36px;
                text-align  : center;
                margin-right: 20px;
                position    : relative;

                i {
                    font-size : 34px;
                    color     : #ffffff;
                    width     : 60px;
                    display   : inline-block;
                    position  : relative;
                    z-index   : 111;
                    margin-top: -8px;

                    @media(max-width: 991px) {
                        font-size: 24px;
                        width: 45px;
                    }

                    @media(max-width: 767px) {
                        font-size: 34px;
                        width: 60px;
                    }
                }

                &::before {
                    content            : "";
                    position           : absolute;
                    border-width       : 15px 30px;
                    border-style       : solid;
                    border-top-color   : transparent;
                    border-right-color : transparent;
                    border-bottom-color: ${colors.green};
                    border-left-color  : transparent;
                    top                : -30px;
                    left               : 0;
                    z-index            : 1;

                    @media(max-width: 991px) {
                        border-width: 12px 23px;
                        top: -24px;
                    }

                    @media(max-width: 767px) {
                        border-width: 15px 30px;
                        top: -30px;
                    }
                }

                &:after {
                    content            : "";
                    position           : absolute;
                    border-width       : 15px 30px;
                    border-style       : solid;
                    border-top-color   : ${colors.green};
                    border-right-color : transparent;
                    border-bottom-color: transparent;
                    border-left-color  : transparent;
                    bottom             : -30px;
                    left               : 0;
                    z-index            : 1;

                    @media(max-width: 991px) {
                        border-width: 12px 23px;
                        bottom: -24px;
                    }

                    @media(max-width: 767px) {
                        border-width: 15px 30px;
                        bottom: -30px;
                    }
                }

                @media(max-width: 991px) {
                    height: 22px;
                    margin-right: 10px;
                }

                @media(max-width: 767px) {
                    height: 36px;
                    margin-right: 20px;
                }
            }

            .box-title {
                margin-top: -15px;

                h6 {
                    color         : ${colors.black1};
                    text-transform: uppercase;
                    font-weight   : 700;
                    font-size     : 18px;
                    margin-bottom : 8px;

                    @media(max-width: 991px) {
                        font-size: 15px;
                        letter-spacing: 0;
                    }

                    @media(max-width: 767px) {
                        font-size: 18px;
                        letter-spacing: 0.3px;
                    }

                    @media(max-width: 575px) {
                        font-size: 15px;
                    }
                }

                p {
                    font-size: 16px;
                    color    : ${colors.text3};
                    line-height: 24px;

                    @media(max-width: 991px) {
                        font-size: 14px;
                        letter-spacing: 0;
                    }

                    @media(max-width: 767px) {
                        font-size: 14px;
                        letter-spacing: 0.3px;
                    }
                }
            }

            @media(max-width: 991px) {
                padding: 25px 10px 8px;
            }

            @media(max-width: 767px) {
                padding: 35px 20px;
                margin-bottom: 25px;
            }
        }

        @media(max-width: 767px) {
            padding: 30px 0 15px;
        }
    }
`;
