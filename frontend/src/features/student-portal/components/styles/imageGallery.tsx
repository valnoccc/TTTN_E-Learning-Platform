import styled from "styled-components";

export const Styles = styled.div`
    .gallery-area {
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

        .gallery-box {
            overflow: hidden;
            position: relative;
            img {
                width: 100%;
                aspect-ratio: 1 / 1;
                object-fit: cover;
                transition : all 0.3s ease;
                &:hover {
                    transform: scale(1.1);
                }
            }
        }
    }
`;
