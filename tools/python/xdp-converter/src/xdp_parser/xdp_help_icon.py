from xdp_parser.xdp_help_text import XdpHelpText


class XdpHelpIcon(XdpHelpText):
    def is_help_icon(self) -> bool:
        return True
